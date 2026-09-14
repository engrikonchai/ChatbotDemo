-- Phase 2: idempotent owner onboarding.
--
-- Runs once per new Supabase auth user (email/password signup) and, in a
-- single transaction:
--   1. creates their profile row
--   2. creates their first business ("Adria Stay Budva") — only if they
--      don't already have one, so retries/duplicate trigger fires never
--      create a second business
--   3. seeds the exact FAQ knowledge from lib/chat/knowledge.ts
--   4. creates default widget settings, seeded from lib/chat/translations.ts
--
-- SECURITY DEFINER lets this function write to tables the (as yet
-- unauthenticated-in-this-transaction) new user has no RLS access to
-- yet — this is the standard, safe Supabase pattern for this, since the
-- function body is fixed and only ever triggered by auth.users inserts.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_slug text;
begin
  -- 1. Profile (idempotent: a retried trigger just no-ops here).
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  -- 2. First business — only if this owner doesn't already have one.
  -- Guards against duplicate businesses if this function is ever
  -- invoked more than once for the same user.
  select id into v_business_id from public.businesses where owner_id = new.id limit 1;

  if v_business_id is null then
    v_slug := 'adria-stay-budva-' || substr(new.id::text, 1, 8);

    insert into public.businesses (
      owner_id, name, slug, business_type, location,
      default_language, supported_languages, is_active
    )
    values (
      new.id, 'Adria Stay Budva', v_slug, 'apartment', 'Budva, Montenegro',
      'en', array['en', 'me', 'ru'], true
    )
    on conflict (slug) do nothing
    returning id into v_business_id;

    -- Extremely unlikely slug collision fallback: re-select.
    if v_business_id is null then
      select id into v_business_id from public.businesses where owner_id = new.id limit 1;
    end if;
  end if;

  -- 3. Seed knowledge (only if this business has none yet).
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

  -- 4. Default widget settings (idempotent via the unique business_id constraint).
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
