from datetime import date

import pytest
from fastapi import HTTPException

from app.models.trip import PriceInputMode
from app.services.trip_service import nights_between, normalize_price_total, validate_dates


def test_nights_between_single_night():
    assert nights_between(date(2025, 8, 5), date(2025, 8, 6)) == 1


def test_nights_between_multi_night():
    assert nights_between(date(2025, 8, 6), date(2025, 8, 8)) == 2


def test_validate_dates_rejects_equal_dates():
    with pytest.raises(HTTPException):
        validate_dates(date(2025, 8, 5), date(2025, 8, 5))


def test_validate_dates_rejects_reversed_dates():
    with pytest.raises(HTTPException):
        validate_dates(date(2025, 8, 6), date(2025, 8, 5))


def test_normalize_price_total_mode():
    assert normalize_price_total(440, None, PriceInputMode.total, nights=1) == 440.0


def test_normalize_price_per_night_mode_multiplies_by_nights():
    assert normalize_price_total(None, 495, PriceInputMode.per_night, nights=2) == 990.0


def test_normalize_price_none_mode_is_excluded():
    assert normalize_price_total(None, None, PriceInputMode.none, nights=1) is None


def test_normalize_price_total_mode_requires_price_total():
    with pytest.raises(HTTPException):
        normalize_price_total(None, None, PriceInputMode.total, nights=1)


def test_normalize_price_per_night_mode_requires_price_per_night_input():
    with pytest.raises(HTTPException):
        normalize_price_total(None, None, PriceInputMode.per_night, nights=1)
