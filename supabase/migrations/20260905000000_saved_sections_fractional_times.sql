-- Loop boundaries used to come from a Chakra RangeSlider whose default step of
-- 1 meant start_time and end_time were always whole seconds, so integer columns
-- were sufficient. The wavesurfer timeline positions loops continuously, and
-- Postgres rejected the fractional values:
--   invalid input syntax for type integer: "166.61218337538818"
--
-- Widening is non-lossy - every existing integer is a valid double - and needs
-- no backfill. It also brings signed-in users back in line with anonymous ones,
-- whose loops go to localStorage and have been keeping sub-second precision.

alter table saved_sections
  alter column start_time type double precision,
  alter column end_time   type double precision;
