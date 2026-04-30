-- Multi-user RLS for clutch-pick.
-- Enforces pairwise spoiler-free reveal at the database layer:
--   * a prediction row is visible to user U iff U made it,
--     U has submitted for the same game day,
--     or the game day is closed (results in).

-- predictions
alter table predictions enable row level security;

drop policy if exists predictions_select on predictions;
create policy predictions_select on predictions for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from games g
    join game_days d on d.id = g.game_day_id
    where g.id = predictions.game_id
      and (
        d.status = 'closed'
        or exists (
          select 1 from daily_submissions s
          where s.game_day_id = g.game_day_id
            and s.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists predictions_insert on predictions;
create policy predictions_insert on predictions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists predictions_update on predictions;
create policy predictions_update on predictions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- daily_submissions: who-has-submitted is public-to-authenticated
-- so the roster can show "still picking" badges without leaking picks.
alter table daily_submissions enable row level security;

drop policy if exists daily_submissions_select on daily_submissions;
create policy daily_submissions_select on daily_submissions for select to authenticated
  using (true);

drop policy if exists daily_submissions_insert on daily_submissions;
create policy daily_submissions_insert on daily_submissions for insert to authenticated
  with check (user_id = (select auth.uid()));

-- profiles: visible to all authenticated; self-update only.
alter table profiles enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- games and game_days: read-only for authenticated. Writes go through
-- the service-role admin client used by the sync API, which bypasses RLS.
alter table games enable row level security;

drop policy if exists games_select on games;
create policy games_select on games for select to authenticated using (true);

alter table game_days enable row level security;

drop policy if exists game_days_select on game_days;
create policy game_days_select on game_days for select to authenticated using (true);

-- Indexes the predictions_select policy depends on. FK indexes likely
-- already exist; create-if-not-exists keeps the migration idempotent.
create index if not exists predictions_game_id_idx on predictions(game_id);
create index if not exists daily_submissions_user_day_idx
  on daily_submissions(user_id, game_day_id);
create index if not exists games_game_day_id_idx on games(game_day_id);
