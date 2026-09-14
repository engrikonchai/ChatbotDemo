-- Repair migration: fixes the demo business slug and backfills any
-- account that signed up before this fix (or whose trigger fire didn't
-- complete for any other reason). Safe to run any number of times.
--
-- Bug being fixed: the original handle_new_user() (see
-- 20260201000300_onboarding.sql) always suffixed the demo business's
-- slug with a chunk of the new user's id — e.g. "adria-stay-budva-a1b2c3d4"
-- — so it never actually produced the bare "adria-stay-budva" slug the
-- public landing page looks up (lib/chat/knowledge.ts DEMO_BUSINESS_SLUG,
-- lib/server/widget-service.ts resolveActiveBusinessBySlug). That
-- mismatch is why the public chat widget stopped resolving a business
-- at all after Phase 2 shipped.
--
-- The onboarding logic is pulled out into public.onboard_user(uuid,
-- text) so both the auth.users trigger and the one-time backfill below
-- can share it instead of duplicating ~80 lines of SQL.

create or replace function public.onboard_user(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_slug text;
begin
  insert into public.profiles (id, display_name)
  values (p_user_id, split_part(p_email, '@', 1))
  on conflict (id) do nothing;

  select id into v_business_id from public.businesses where owner_id = p_user_id limit 1;

  if v_business_id is null then
    -- Prefer the canonical demo slug; only fall back to a suffixed one
    -- if it's already taken by a *different* owner (this is a
    -- single-tenant demo — there should only ever be one
    -- "adria-stay-budva", and the public landing page depends on that
    -- bare slug resolving).
    if not exists (select 1 from public.businesses where slug = 'adria-stay-budva') then
      v_slug := 'adria-stay-budva';
    else
      v_slug := 'adria-stay-budva-' || substr(p_user_id::text, 1, 8);
    end if;

    insert into public.businesses (
      owner_id, name, slug, business_type, location,
      default_language, supported_languages, is_active
    )
    values (
      p_user_id, 'Adria Stay Budva', v_slug, 'apartment', 'Budva, Montenegro',
      'en', array['en', 'me', 'ru'], true
    )
    on conflict (slug) do nothing
    returning id into v_business_id;

    if v_business_id is null then
      select id into v_business_id from public.businesses where owner_id = p_user_id limit 1;
    end if;
  end if;

  if v_business_id is not null and not exists (
    select 1 from public.knowledge_items where business_id = v_business_id
  ) then
    insert into public.knowledge_items (business_id, category, question, answer_en, answer_me, answer_ru, sort_order)
    values
      (v_business_id, 'parking', 'Is parking available?',
       'Yes — one free private parking space is included with the apartment.',
       'Da — u cijenu apartmana je uključeno jedno besplatno privatno parking mjesto.',
       'Да — в апартаментах есть одно бесплатное частное парковочное место.', 0),
      (v_business_id, 'checkin', 'What time is check-in?',
       'Check-in is from 14:00.',
       'Prijava (check-in) je moguća od 14:00 časova.',
       'Заселение возможно с 14:00.', 1),
      (v_business_id, 'checkout', 'What time is check-out?',
       'Check-out is by 10:00.',
       'Odjava (check-out) je do 10:00 časova.',
       'Выезд — до 10:00.', 2),
      (v_business_id, 'pets', 'Are pets allowed?',
       'Small pets are allowed with prior approval from the host.',
       'Manji ljubimci su dozvoljeni uz prethodnu saglasnost domaćina.',
       'Небольшие домашние животные допускаются по предварительному согласованию с хозяином.', 3),
      (v_business_id, 'wifi', 'Is there Wi-Fi?',
       'Yes, free Wi-Fi is available throughout the apartment.',
       'Da, besplatan Wi-Fi je dostupan u cijelom apartmanu.',
       'Да, бесплатный Wi-Fi доступен на всей территории апартаментов.', 4),
      (v_business_id, 'smoking', 'Is smoking allowed?',
       'Smoking is not allowed inside the apartment.',
       'Pušenje unutar apartmana nije dozvoljeno.',
       'Курение в апартаментах не разрешено.', 5),
      (v_business_id, 'beach', 'How far is the beach?',
       'The nearest beach is approximately 8 minutes on foot.',
       'Najbliža plaža je udaljena oko 8 minuta pješke.',
       'Ближайший пляж находится примерно в 8 минутах ходьбы.', 6),
      (v_business_id, 'old_town', 'How far is the Old Town?',
       'Budva''s Old Town is approximately 15 minutes on foot.',
       'Stari grad Budva je udaljen oko 15 minuta pješke.',
       'Старый город Будвы находится примерно в 15 минутах ходьбы.', 7),
      (v_business_id, 'airport_transfer', 'Can you arrange an airport transfer?',
       'An airport transfer can be arranged on request. The price needs to be confirmed directly with the host — I can pass your enquiry along if you''d like.',
       'Transfer sa aerodroma se može organizovati na upit. Cijenu je potrebno potvrditi direktno sa domaćinom — mogu proslijediti vaš upit ako želite.',
       'Трансфер из аэропорта можно организовать по запросу. Стоимость нужно уточнить напрямую у хозяина — я могу передать ваш запрос, если хотите.', 8),
      (v_business_id, 'payment', 'How do I pay?',
       'Payment is confirmed directly with the host — I don''t process payments here in the chat.',
       'Način plaćanja se dogovara direktno sa domaćinom — ja u čet-u ne obrađujem plaćanja.',
       'Оплата согласовывается напрямую с хозяином — в этом чате я платежи не обрабатываю.', 9),
      (v_business_id, 'price', 'How much does it cost per night?',
       'The nightly price depends on your dates and is confirmed directly by the host. I can start a quick booking enquiry so the host can confirm pricing and availability — would you like to do that?',
       'Cijena po noćenju zavisi od datuma i potvrđuje je direktno domaćin. Mogu pokrenuti kratak upit za rezervaciju kako bi domaćin potvrdio cijenu i dostupnost — želite li to?',
       'Стоимость за ночь зависит от дат и подтверждается непосредственно хозяином. Я могу начать короткий запрос на бронирование, чтобы хозяин подтвердил цену и наличие свободных дат — хотите?', 10);
  end if;

  if v_business_id is not null then
    insert into public.widget_settings (
      business_id, title, welcome_message_en, welcome_message_me, welcome_message_ru
    )
    values (
      v_business_id,
      'Adria Assistant',
      'Hi! 👋 I''m the Adria Stay assistant. I can help with the apartment, amenities, location and booking enquiries. How can I help?',
      'Zdravo! 👋 Ja sam asistent Adria Stay. Mogu pomoći sa informacijama o apartmanu, sadržajima, lokaciji i upitima za rezervaciju. Kako mogu pomoći?',
      'Привет! 👋 Я ассистент Adria Stay. Я могу помочь с информацией об апартаментах, удобствах, расположении и вопросами по бронированию. Чем могу помочь?'
    )
    on conflict (business_id) do nothing;
  end if;
end;
$$;

-- The trigger function now just delegates to the shared logic above.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.onboard_user(new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Repair existing data: claim the bare "adria-stay-budva" slug for the
-- oldest existing business whose slug got the old buggy suffix, but
-- only if nothing already holds the bare slug (never overwrite a real
-- row, never create a duplicate).
-- ---------------------------------------------------------------------
do $$
declare
  v_target_id uuid;
begin
  if not exists (select 1 from public.businesses where slug = 'adria-stay-budva') then
    select id into v_target_id
    from public.businesses
    where slug like 'adria-stay-budva-%'
    order by created_at asc
    limit 1;

    if v_target_id is not null then
      update public.businesses set slug = 'adria-stay-budva' where id = v_target_id;
    end if;
  end if;
end;
$$;

-- Defensive: the demo business should always be active with mock AI on,
-- regardless of anything that may have toggled it off by mistake.
update public.businesses set is_active = true where slug = 'adria-stay-budva' and is_active is distinct from true;

update public.widget_settings ws
set mock_ai_enabled = true
from public.businesses b
where ws.business_id = b.id and b.slug = 'adria-stay-budva' and ws.mock_ai_enabled is distinct from true;

-- ---------------------------------------------------------------------
-- Backfill: any auth.users row missing a profile or a business (signed
-- up before the trigger existed, or a fire that partially failed) gets
-- the same onboarding applied now, via the exact same idempotent
-- function the trigger uses.
-- ---------------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in
    select au.id, au.email
    from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
       or not exists (select 1 from public.businesses b where b.owner_id = au.id)
  loop
    perform public.onboard_user(u.id, u.email);
  end loop;
end;
$$;
