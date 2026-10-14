from django.contrib.admin.apps import AdminConfig


class InomarkaAdminConfig(AdminConfig):
    """Django admin o'rniga dashboard'li admin sayti."""

    default_site = "main.admin_site.InomarkaAdminSite"
