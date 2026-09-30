from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ClassificationResult(BaseModel):
    """Validated shape for untrusted classifier output."""

    model_config = ConfigDict(extra="forbid")

    category: Literal["SALES_INQUIRY", "SUPPORT", "OTHER"]
    confidence: float = Field(ge=0, le=1)
    extracted: dict[str, str] = Field(default_factory=dict)
    provider: str = Field(min_length=1, max_length=80)
