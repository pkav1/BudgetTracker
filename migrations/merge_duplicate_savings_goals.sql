-- Merge duplicate savings goals ("vaults")
-- ============================================================================
-- Context: before the import fix, goal matching during a statement import read
-- the in-memory app state (not the DB) and compared names case/space-sensitively,
-- so a goal created by one import could be invisible to the next and get inserted
-- again. Result: two rows for one logical goal (e.g. two "Holidays"), whose
-- balances sum to the true total. There is NO transaction -> savings foreign key;
-- a goal's `balance` is a denormalized running total. So "merge" = fold the
-- duplicates' balances/meta onto one survivor row and delete the empties. Nothing
-- else references the deleted ids.
--
-- Run STEP 1 first (read-only) and eyeball the output. Only run STEP 2 once the
-- preview looks right. STEP 3 (unique index) is deferred until after the merge.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 0 — Sanity check: confirm the `savings` columns the merge relies on.
-- The ranking below orders by `created_at`; if that column does NOT appear in
-- this result, replace every `s.created_at asc,` line further down with nothing
-- (the `s.id asc` tiebreak alone still yields a deterministic survivor).
-- ----------------------------------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_name = 'savings'
order by ordinal_position;


-- ----------------------------------------------------------------------------
-- STEP 1a — Show every row in a duplicate group (read-only).
-- Brackets around name expose leading/trailing whitespace; name_len exposes it too.
-- created_at lets you line rows up against import dates.
-- ----------------------------------------------------------------------------
select
  s.user_id,
  '[' || s.name || ']'                         as name_shown,
  length(s.name)                               as name_len,
  s.balance,
  s.target,
  (s.photo_url is not null)                    as has_photo,
  s.destination_name,
  s.departure_date,
  s.created_at,
  s.id
from savings s
where (s.user_id, lower(trim(s.name))) in (
  select user_id, lower(trim(name))
  from savings
  group by user_id, lower(trim(name))
  having count(*) > 1
)
order by s.user_id, lower(trim(s.name)), s.created_at;


-- ----------------------------------------------------------------------------
-- STEP 1b — Preview the merged result (read-only): what each survivor becomes,
-- and how many rows would be deleted. Survivor = the row with photo/destination
-- meta if any, else the oldest; ties broken by id.
-- ----------------------------------------------------------------------------
with ranked as (
  select
    s.*,
    lower(trim(s.name)) as norm_name,
    row_number() over (
      partition by s.user_id, lower(trim(s.name))
      order by
        (case when s.photo_url is not null
                or s.destination_name is not null
                or s.departure_date is not null then 0 else 1 end),
        s.created_at asc,
        s.id asc
    ) as rn
  from savings s
),
groups as (
  select
    user_id,
    norm_name,
    count(*)     as rows_before,
    sum(balance) as merged_balance,
    max(target)  as merged_target
  from ranked
  group by user_id, norm_name
  having count(*) > 1
)
select
  sv.name              as survivor_name,
  sv.id                as survivor_id,
  g.rows_before,
  (g.rows_before - 1)  as rows_to_delete,
  sv.balance           as survivor_balance_before,
  g.merged_balance     as survivor_balance_after,
  sv.target            as survivor_target_before,
  g.merged_target      as survivor_target_after
from ranked sv
join groups g
  on g.user_id = sv.user_id and g.norm_name = sv.norm_name
where sv.rn = 1
order by sv.name;


-- ----------------------------------------------------------------------------
-- STEP 2 — Execute the merge. DO NOT RUN until STEP 1 output is confirmed.
-- Wrapped in a transaction; the plan is materialised up front so the ranking
-- can't shift under the mutations. Idempotent: re-running after a clean merge
-- finds no duplicate groups and is a no-op.
-- ----------------------------------------------------------------------------
-- begin;
--
-- create temporary table _dup_plan on commit drop as
-- with ranked as (
--   select
--     s.id, s.user_id, s.balance, s.target,
--     s.photo_url, s.destination_name, s.departure_date,
--     lower(trim(s.name)) as norm_name,
--     row_number() over (
--       partition by s.user_id, lower(trim(s.name))
--       order by
--         (case when s.photo_url is not null
--                 or s.destination_name is not null
--                 or s.departure_date is not null then 0 else 1 end),
--         s.created_at asc,
--         s.id asc
--     ) as rn
--   from savings s
-- ),
-- groups as (
--   select
--     user_id,
--     norm_name,
--     sum(balance) as merged_balance,
--     max(target)  as merged_target,
--     (array_remove(array_agg(photo_url        order by rn), null))[1] as merged_photo,
--     (array_remove(array_agg(destination_name order by rn), null))[1] as merged_dest,
--     (array_remove(array_agg(departure_date   order by rn), null))[1] as merged_departure
--   from ranked
--   group by user_id, norm_name
--   having count(*) > 1
-- )
-- select
--   r.id,
--   r.rn,
--   g.merged_balance,
--   g.merged_target,
--   g.merged_photo,
--   g.merged_dest,
--   g.merged_departure
-- from ranked r
-- join groups g on g.user_id = r.user_id and g.norm_name = r.norm_name;
--
-- -- Fold merged totals + coalesced meta onto the survivor (rn = 1).
-- update savings s
-- set balance          = p.merged_balance,
--     target           = p.merged_target,
--     photo_url        = p.merged_photo,
--     destination_name = p.merged_dest,
--     departure_date   = p.merged_departure
-- from _dup_plan p
-- where p.rn = 1 and s.id = p.id;
--
-- -- Delete the now-empty duplicates (rn > 1).
-- delete from savings s
-- using _dup_plan p
-- where p.rn > 1 and s.id = p.id;
--
-- commit;


-- ----------------------------------------------------------------------------
-- STEP 3 — Deferred. Only after STEP 2 is confirmed clean, add a DB-level guard
-- so a duplicate can never be inserted again:
-- ----------------------------------------------------------------------------
-- create unique index if not exists savings_user_norm_name_uidx
--   on savings (user_id, lower(trim(name)));
