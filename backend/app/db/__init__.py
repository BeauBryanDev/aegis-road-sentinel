# Import all ORM models here so SQLAlchemy can resolve cross-model relationships
# (e.g. AllowedCar → User) before any query is executed.
from app.models.users import User  # noqa: F401
from app.models.allowed_cars import AllowedCar  # noqa: F401
from app.models.cars import Car  # noqa: F401
from app.models.detections import Detection  # noqa: F401
