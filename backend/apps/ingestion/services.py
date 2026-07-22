import re
import urllib.request
import html
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from apps.opportunities.models import Opportunity, Category, Country
from apps.ingestion.models import IngestionLog

class IngestionService:
    # Target paginated URL template
    PORTAL_URL_TEMPLATE = "https://www.opportunitydesk.org/page/{page_number}/"
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    @classmethod
    def fetch_and_parse_feeds(cls, max_pages=30):
        """
        Upgraded HTML pagination scraper. Iterates pages 1 to max_pages, crawls opportunity titles and detail links,
        performs bandwidth optimization (skips existing URLs), and deep-parses opportunity detail text.
        """
        results = {"created": 0, "updated": 0, "rejected": 0}
        
        for page in range(1, max_pages + 1):
            list_url = cls.PORTAL_URL_TEMPLATE.format(page_number=page)
            try:
                # Fetch list page
                req = urllib.request.Request(list_url, headers={"User-Agent": cls.USER_AGENT})
                with urllib.request.urlopen(req, timeout=20) as response:
                    html_data = response.read()

                # Parse list HTML
                soup = BeautifulSoup(html_data, "html.parser")
                
                # Locate post headings containing detail links
                # WordPress standard: h2.entry-title a, h2.post-title a, or generic h2 containing a tag
                headings = soup.find_all(["h2", "h1"])
                links_to_crawl = []
                
                for heading in headings:
                    a_tag = heading.find("a")
                    if a_tag and a_tag.get("href"):
                        href = a_tag.get("href")
                        title_text = a_tag.get_text(strip=True)
                        
                        # Only crawl links that belong to opportunitydesk posts (containing date paths like /202)
                        if "opportunitydesk.org/20" in href and title_text:
                            links_to_crawl.append((title_text, href))

                # Crawl each detail page
                for title, link in links_to_crawl:
                    # BANDWIDTH OPTIMIZATION: If URL exists in DB, skip crawling detail page
                    if Opportunity.objects.filter(source_url=link).exists():
                        # Optionally: we can count it as updated or just skip to save requests
                        results["updated"] += 1
                        continue

                    # Fetch opportunity detail content
                    status = cls._crawl_detail_page(title, link)
                    results[status] += 1

            except Exception as e:
                IngestionLog.objects.create(
                    payload={"list_url": list_url, "error": str(e)},
                    status="rejected",
                    errors={"message": f"List page crawl error: {str(e)}"}
                )
                results["rejected"] += 1

        return results

    @classmethod
    def _crawl_detail_page(cls, title, link):
        """
        Fetches detail page, extracts article text, parses details, and writes to database.
        """
        payload = {
            "title": title,
            "link": link
        }
        
        try:
            title = html.unescape(title)
            req = urllib.request.Request(link, headers={"User-Agent": cls.USER_AGENT})
            with urllib.request.urlopen(req, timeout=15) as response:
                detail_html = response.read()

            soup = BeautifulSoup(detail_html, "html.parser")
            
            # Locate entry content container (WordPress defaults: div.entry-content or article)
            content_div = soup.find(["div", "article"], class_=["entry-content", "post-content", "post-entry"])
            if not content_div:
                content_div = soup.find("body")  # Fallback to full body

            description = content_div.get_text(separator="\n", strip=True) if content_div else ""
            description = html.unescape(description)
            
            # Map values using parsing heuristics
            category_slug = cls._detect_category(title, [title])
            category = Category.objects.get(slug=category_slug)
            
            # Heuristics extraction
            deadline = cls._extract_deadline(description, "")
            start_date = cls._extract_start_date(description, "")
            min_age, max_age = cls._extract_age_range(description)
            
            is_online = any(kw in (title + " " + description).lower() for kw in ["online", "remote", "virtual", "webinar"])
            is_onsite = not is_online or any(kw in (title + " " + description).lower() for kw in ["onsite", "travel", "venue", "physical", "accommodation"])
            if not is_online and not is_onsite:
                is_onsite = True
                
            is_worldwide, eligible_countries, destination_country = cls._detect_countries(title, description, [title])

            cleaned_desc = cls._clean_scraped_description(description)
            corrected_title = cls._fix_spelling_errors(title)
            application_url = cls._extract_official_link(soup, link)

            with transaction.atomic():
                opportunity, created = Opportunity.objects.update_or_create(
                    source_url=link,
                    defaults={
                        "title": corrected_title,
                        "description": cleaned_desc,
                        "application_url": application_url,
                        "category": category,
                        "min_age": min_age,
                        "max_age": max_age,
                        "is_worldwide": is_worldwide,
                        "destination_country": destination_country,
                        "is_online": is_online,
                        "is_onsite": is_onsite,
                        "deadline": deadline,
                        "start_date": start_date,
                        "is_active": True
                    }
                )

                if eligible_countries:
                    opportunity.eligible_home_countries.set(eligible_countries)
                elif is_worldwide:
                    opportunity.eligible_home_countries.clear()

                IngestionLog.objects.create(
                    payload=payload,
                    status="created" if created else "updated",
                    opportunity=opportunity
                )
                return "created" if created else "updated"

        except Exception as e:
            IngestionLog.objects.create(
                payload=payload,
                status="rejected",
                errors={"exception": str(e)}
            )
            return "rejected"

    @classmethod
    def _detect_category(cls, title, tags):
        combined = (title.lower() + " " + " ".join(tags)).lower()
        if any(kw in combined for kw in ["scholarship", "fellowship", "study", "degree", "mba", "phd", "academic", "university"]):
            return Category.LEARNING
        if any(kw in combined for kw in ["internship", "job", "career", "work", "recruitment", "trainee"]):
            return Category.WORKING
        if any(kw in combined for kw in ["volunteer", "mission", "community", "peace", "unv"]):
            return Category.VOLUNTEERING
        if any(kw in combined for kw in ["competition", "award", "prize", "contest", "hackathon", "challenge"]):
            return Category.COMPETING
        return Category.MAKING_CHANGE

    @classmethod
    def _extract_deadline(cls, text, pub_date_str):
        patterns = [
            r"(?:deadline|apply before|close on)\s*(?:is|on|by)?\s*[:\s]*([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4})",
            r"(?:deadline|apply before|close on)\s*(?:is|on|by)?\s*[:\s]*(\d{1,2}\s+[a-zA-Z]+\s+\d{4})",
            r"(?:deadline|apply before|close on)\s*(?:is|on|by)?\s*[:\s]*([a-zA-Z]+\s+\d{1,2},\s+\d{4})",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                date_str = re.sub(r"(\d+)(?:st|nd|rd|th)", r"\1", date_str)
                try:
                    for fmt in ("%B %d, %Y", "%d %B %Y", "%b %d, %Y"):
                        try:
                            parsed_date = datetime.strptime(date_str, fmt).date()
                            if parsed_date >= timezone.now().date():
                                return parsed_date
                        except ValueError:
                            continue
                except Exception:
                    pass

        return timezone.now().date() + timedelta(days=30)

    @classmethod
    def _extract_start_date(cls, text, pub_date_str):
        patterns = [
            r"(?:starts on|commences on|program begins|commencing on)\s*(?:is|on|by)?\s*[:\s]*([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4})",
            r"(?:starts on|commences on|program begins|commencing on)\s*(?:is|on|by)?\s*[:\s]*(\d{1,2}\s+[a-zA-Z]+\s+\d{4})",
            r"(?:starts on|commences on|program begins|commencing on)\s*(?:is|on|by)?\s*[:\s]*([a-zA-Z]+\s+\d{1,2},\s+\d{4})",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                date_str = re.sub(r"(\d+)(?:st|nd|rd|th)", r"\1", date_str)
                try:
                    for fmt in ("%B %d, %Y", "%d %B %Y", "%b %d, %Y"):
                        try:
                            parsed_date = datetime.strptime(date_str, fmt).date()
                            return parsed_date
                        except ValueError:
                            continue
                except Exception:
                    pass

        return None

    @classmethod
    def _extract_age_range(cls, text):
        text_lower = text.lower()
        match_range = re.search(r"(\d{2})\s*(?:-|–|to|and|\s)+\s*(\d{2})\s*(?:years|years old|yrs)?", text_lower)
        if match_range:
            min_a = int(match_range.group(1))
            max_a = int(match_range.group(2))
            if 10 <= min_a <= max_a <= 50:
                return min_a, max_a

        match_min = re.search(r"(?:aged|at least|older than|minimum of)\s*(\d{2})", text_lower)
        if match_min:
            min_a = int(match_min.group(1))
            if 10 <= min_a <= 40:
                return min_a, None

        return None, None

    @classmethod
    def _detect_countries(cls, title, description, tags):
        combined = (title + " " + description + " " + " ".join(tags)).lower()
        is_worldwide = any(kw in combined for kw in ["worldwide", "any nationality", "all nationalities", "international", "global", "open to all"])

        countries_list = list(Country.objects.all())
        eligible_countries = []
        destination_country = None

        for country in countries_list:
            country_name_lower = country.name.lower()
            if re.search(rf"\b{re.escape(country_name_lower)}\b", combined):
                if re.search(rf"\b{re.escape(country_name_lower)}\b", title.lower()):
                    destination_country = country
                else:
                    eligible_countries.append(country)

        if not eligible_countries:
            is_worldwide = True

        return is_worldwide, eligible_countries, destination_country

    @classmethod
    def _clean_scraped_description(cls, text):
        """
        Cleans up raw scraped text to remove label dumps and extract a 2-sentence summary.
        """
        if not text:
            return ""
            
        text = html.unescape(text)
        
        # Remove placeholder errors/warnings/unspecified deadlines
        placeholder_patterns = [
            r"deadline\s*:\s*(?:unspecified|ongoing|not specified|none|tbd|unknown)",
            r"application\s*deadline\s*:\s*(?:unspecified|ongoing|not specified|none|tbd|unknown)",
            r"application\s*closed",
            r"opportunity\s*closed"
        ]
        cleaned = text
        for pat in placeholder_patterns:
            cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)

        # Split at common label headers and keep only the intro paragraph
        stop_signals = [
            r"deadline\s*:",
            r"eligibility\s*:",
            r"benefits\s*:",
            r"how to apply\s*:",
            r"application\s*:",
            r"value\s*:",
            r"scholarship value\s*:",
            r"requirements\s*:",
            r"eligible countries\s*:",
            r"stipend\s*:",
            r"criteria\s*:"
        ]
        
        cleaned = text
        for signal in stop_signals:
            parts = re.split(signal, cleaned, flags=re.IGNORECASE)
            if parts:
                cleaned = parts[0]
                
        # Clean up any leftover label headers or trailing characters
        for signal in stop_signals:
            cleaned = re.sub(signal + r".*$", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
            
        # Strip multiple newlines/tabs and replace with spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Remove empty bracketed/parenthesized content
        cleaned = re.sub(r'\[\s*\]', '', cleaned)
        
        # Extract the first 2 sentences
        sentences = re.split(r'(?<=[.!?])\s+', cleaned)
        summary_sentences = []
        for sentence in sentences:
            s_clean = sentence.strip()
            if s_clean and len(summary_sentences) < 2:
                # Basic validation: sentence should start with letter/number
                if re.match(r'^[A-Za-z0-9]', s_clean):
                    summary_sentences.append(s_clean)
        
        if not summary_sentences:
            summary = cleaned[:247] + "..." if len(cleaned) > 250 else cleaned
        else:
            summary = " ".join(summary_sentences)
            
        if len(summary) > 250:
            summary = summary[:247] + "..."
            
        return cls._fix_spelling_errors(summary)

    @classmethod
    def _fix_spelling_errors(cls, text):
        """
        Scans text for common spelling mistakes/typos found in source opportunity portals
        and replaces them with the correct words while preserving case.
        """
        if not text:
            return ""
            
        corrections = {
            r"\bdemocratistaion\b": "democratisation",
            r"\bdemocratistaions\b": "democratisations",
            r"\boppurtunity\b": "opportunity",
            r"\boppurtunities\b": "opportunities",
            r"\bscholarshup\b": "scholarship",
            r"\bscholarshups\b": "scholarships",
            r"\binternshup\b": "internship",
            r"\binternshups\b": "internships",
            r"\bfellowshup\b": "fellowship",
            r"\bfellowshups\b": "fellowships",
            r"\bvoluntering\b": "volunteering",
            r"\bcompetion\b": "competition",
            r"\bcompetions\b": "competitions",
            r"\beligibilty\b": "eligibility",
            r"\bunspecfied\b": "unspecified",
            r"\bgoverment\b": "government",
            r"\bgoverments\b": "governments",
            r"\bdevelopement\b": "development",
            r"\bdevelopements\b": "developments",
            r"\benviroment\b": "environment",
            r"\benviroments\b": "environments",
            r"\bprograme\b": "program",
            r"\bprogrames\b": "programs",
            r"\bprogrammes\b": "programs",
            r"\breceipient\b": "recipient",
            r"\breceipients\b": "recipients",
            r"\brequriment\b": "requirement",
            r"\brequriments\b": "requirements",
            r"\bapplicaton\b": "application",
            r"\bapplicatons\b": "applications"
        }
        
        cleaned = text
        for pattern, replacement in corrections.items():
            def replace_match(match):
                word = match.group(0)
                if word.istitle():
                    return replacement.capitalize()
                elif word.isupper():
                    return replacement.upper()
                return replacement
                
            cleaned = re.sub(pattern, replace_match, cleaned, flags=re.IGNORECASE)
            
        return cleaned

    @classmethod
    def _extract_official_link(cls, soup, detail_url):
        """
        Locates the deep external application link inside the scraped detail page.
        Looks for outbound call-to-actions or external application links, falling back to the detail_url.
        """
        content_div = soup.find(["div", "article"], class_=["entry-content", "post-content", "post-entry"])
        if not content_div:
            content_div = soup
            
        links = content_div.find_all("a")
        
        # Priority 1: Match links with specific call-to-action text
        for a in links:
            href = a.get("href", "")
            text = a.get_text().lower()
            if not href or any(s in href for s in ["opportunitydesk.org", "twitter.com", "facebook.com", "linkedin.com", "whatsapp.com", "telegram.me", "pinterest.com"]):
                continue
            if any(kw in text for kw in ["official link", "click here to apply", "apply here", "apply now", "application link", "official website", "register here"]):
                return href
                
        # Priority 2: Match any external links containing "apply", "register", "form", "scholarship", "job", "career"
        for a in links:
            href = a.get("href", "")
            if not href or any(s in href for s in ["opportunitydesk.org", "twitter.com", "facebook.com", "linkedin.com", "whatsapp.com", "telegram.me", "pinterest.com"]):
                continue
            if any(kw in href.lower() for kw in ["apply", "register", "form", "join", "signup", "application"]):
                return href
                
        # Priority 3: Return the first external link that doesn't look like sharing or ads
        for a in links:
            href = a.get("href", "")
            if href and href.startswith("http") and not any(s in href for s in ["opportunitydesk.org", "twitter.com", "facebook.com", "linkedin.com", "whatsapp.com", "sharing", "intent", "pin"]):
                return href
                
        # Fallback to the detail page itself
        return detail_url
