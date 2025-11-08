-- Fix search_path for security functions

DROP FUNCTION IF EXISTS income_band_score(text);
DROP FUNCTION IF EXISTS age_range_midpoint(text);

CREATE OR REPLACE FUNCTION income_band_score(band text) RETURNS int
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE band
    WHEN '0-25000' THEN 1
    WHEN '25000-50000' THEN 2
    WHEN '50000-100000' THEN 3
    WHEN '100000-200000' THEN 4
    WHEN '200000+' THEN 5
    ELSE 0
  END;
END;
$$;

CREATE OR REPLACE FUNCTION age_range_midpoint(range text) RETURNS int
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE range
    WHEN '18-25' THEN 21
    WHEN '26-35' THEN 30
    WHEN '36-45' THEN 40
    WHEN '46-60' THEN 53
    WHEN '60+' THEN 65
    ELSE 30
  END;
END;
$$;