from rest_framework.pagination import CursorPagination

class OpportunityCursorPagination(CursorPagination):
    page_size = 20
    ordering = "-created_at"  # Must match the model Meta ordering
