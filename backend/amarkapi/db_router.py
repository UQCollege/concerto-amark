# connector/database_router.py
class PelaRouter:
    def db_for_read(self, model, **hints):
        if getattr(model, 'readonly_pela_dev', False):
            return 'pela_dev'  # match the DATABASES['pela_dev'] key
        return None

    def db_for_write(self, model, **hints):
        return None  # disallow writes entirely

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'pela_dev':
            return False
        return None  # prevent migrations to pela_dev