-- full_name becomes "I. M. Lastname" (mirrors FullNameFormatter); concat_ws skips the NULL of a missing middle name.
UPDATE users
SET full_name = concat_ws(
    ' ',
    upper(left(trim(first_name), 1)) || '.',
    upper(left(NULLIF(trim(middle_name), ''), 1)) || '.',
    trim(last_name)
);
