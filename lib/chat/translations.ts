import type { Language } from "@/lib/chat/types";

/** Human-readable label for each supported language (used in the dashboard). */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  me: "Crnogorski / Srpski",
  ru: "Русский",
};

/** The temporary project / engine name shown in the widget's small print. */
export const POWERED_BY_LABEL = "Powered by Adria Assist (demo engine)";

/** Suggested question chips, shown per detected/selected language. */
export const SUGGESTED_QUESTIONS: Record<Language, string[]> = {
  en: [
    "Is parking available?",
    "What time is check-in?",
    "Are pets allowed?",
    "I want to check availability",
  ],
  me: [
    "Imate li parking?",
    "Kada je prijava?",
    "Da li su ljubimci dozvoljeni?",
    "Želim da provjerim dostupnost",
  ],
  ru: [
    "Есть ли парковка?",
    "Во сколько заселение?",
    "Можно с животными?",
    "Хочу проверить свободные даты",
  ],
};

/** Static widget chrome copy. */
export const WIDGET_TEXT: Record<
  Language,
  {
    assistantName: string;
    onlineStatus: string;
    inputPlaceholder: string;
    send: string;
    close: string;
    minimize: string;
    open: string;
    suggestedQuestionsLabel: string;
    yes: string;
    no: string;
  }
> = {
  en: {
    assistantName: "Adria Assistant",
    onlineStatus: "Usually replies instantly",
    inputPlaceholder: "Type your message…",
    send: "Send",
    close: "Close chat",
    minimize: "Minimise chat",
    open: "Ask Adria",
    suggestedQuestionsLabel: "Try asking:",
    yes: "Yes, send to host",
    no: "No, thanks",
  },
  me: {
    assistantName: "Adria Assistant",
    onlineStatus: "Obično odgovara odmah",
    inputPlaceholder: "Unesite poruku…",
    send: "Pošalji",
    close: "Zatvori razgovor",
    minimize: "Umanji razgovor",
    open: "Ask Adria",
    suggestedQuestionsLabel: "Probajte pitati:",
    yes: "Da, pošalji domaćinu",
    no: "Ne, hvala",
  },
  ru: {
    assistantName: "Adria Assistant",
    onlineStatus: "Обычно отвечает мгновенно",
    inputPlaceholder: "Введите сообщение…",
    send: "Отправить",
    close: "Закрыть чат",
    minimize: "Свернуть чат",
    open: "Ask Adria",
    suggestedQuestionsLabel: "Попробуйте спросить:",
    yes: "Да, передайте хозяину",
    no: "Нет, спасибо",
  },
};

/** The very first message shown when a chat window is opened. */
export const GREETING: Record<Language, string> = {
  en: "Hi! 👋 I'm the Adria Stay assistant. I can help with the apartment, amenities, location and booking enquiries. How can I help?",
  me: "Zdravo! 👋 Ja sam asistent Adria Stay. Mogu pomoći sa informacijama o apartmanu, sadržajima, lokaciji i upitima za rezervaciju. Kako mogu pomoći?",
  ru: "Привет! 👋 Я ассистент Adria Stay. Я могу помочь с информацией об апартаментах, удобствах, расположении и вопросами по бронированию. Чем могу помочь?",
};

/** Shown when the visitor greets the assistant again mid-conversation. */
export const GREETING_REPLY: Record<Language, string> = {
  en: "Hello again! How can I help with your stay in Budva?",
  me: "Zdravo opet! Kako mogu pomoći oko vašeg boravka u Budvi?",
  ru: "Здравствуйте ещё раз! Чем могу помочь с вашим пребыванием в Будве?",
};

/** Shown when no known intent matches — the bot never invents an answer. */
export const UNKNOWN_FALLBACK: Record<Language, string> = {
  en: "I don't have verified information about that yet. Would you like me to send your question to the host?",
  me: "Trenutno nemam provjerenu informaciju o tome. Želite li da vaše pitanje proslijedim domaćinu?",
  ru: "У меня пока нет проверенной информации об этом. Хотите, чтобы я передал(а) ваш вопрос хозяину?",
};

export const BOOKING_FLOW_TEXT: Record<
  Language,
  {
    intro: string;
    askCheckOut: string;
    askGuests: string;
    askName: string;
    askContact: string;
    askNote: string;
    consentNotice: string;
    enquiryDisclaimer: string;
    confirmQuestion: string;
    summaryHeading: string;
    summaryCheckIn: string;
    summaryCheckOut: string;
    summaryGuests: string;
    summaryName: string;
    summaryContact: string;
    summaryNote: string;
    successHeading: string;
    successBody: string;
    referenceLabel: string;
    cancelled: string;
    errorDateFormat: string;
    errorDatePast: string;
    errorCheckoutRange: string;
    errorGuests: string;
    errorName: string;
    errorContact: string;
  }
> = {
  en: {
    intro:
      "I can't confirm availability myself — only the host can do that. Let's start a quick booking enquiry so the host can get back to you. What check-in date would you like? (e.g. 2026-06-10)",
    askCheckOut: "Thanks! And what's your check-out date? (e.g. 2026-06-14)",
    askGuests: "How many guests will be staying? (1–4)",
    askName: "What's your full name?",
    askContact: "What's the best way to reach you — phone, WhatsApp or email?",
    askNote: "Any note for the host? Type a message, or reply \"skip\" if not.",
    consentNotice:
      "By submitting, you agree that your details will be sent to the host so they can respond to your enquiry.",
    enquiryDisclaimer: "This is an enquiry, not a confirmed reservation.",
    confirmQuestion: "Shall I send this enquiry to the host?",
    summaryHeading: "Here's what I have — please check it over:",
    summaryCheckIn: "Check-in",
    summaryCheckOut: "Check-out",
    summaryGuests: "Guests",
    summaryName: "Name",
    summaryContact: "Contact",
    summaryNote: "Note",
    successHeading: "Thank you! Your enquiry has been sent.",
    successBody: "The host will confirm availability and get back to you as soon as possible.",
    referenceLabel: "Reference",
    cancelled: "No problem — the enquiry was not sent. Let me know if you'd like to start again anytime.",
    errorDateFormat: "I couldn't read that date. Please use a format like 2026-06-10 or 10.06.2026.",
    errorDatePast: "That date appears to be in the past. Please provide a future date.",
    errorCheckoutRange: "Check-out must be after your check-in date. Please provide a later date.",
    errorGuests: "Please enter a number of guests between 1 and 4.",
    errorName: "Please enter your full name.",
    errorContact: "Please share a phone number, WhatsApp number or email so the host can reach you.",
  },
  me: {
    intro:
      "Ja ne mogu sama potvrditi dostupnost — to može samo domaćin. Hajde da pokrenemo kratak upit za rezervaciju kako bi vam se domaćin javio. Koji datum dolaska želite? (npr. 10.06.2026)",
    askCheckOut: "Hvala! A koji je datum odlaska? (npr. 14.06.2026)",
    askGuests: "Koliko gostiju boravi? (1–4)",
    askName: "Kako se zovete (ime i prezime)?",
    askContact: "Koji je najbolji način da vas kontaktiramo — telefon, WhatsApp ili email?",
    askNote: "Imate li poruku za domaćina? Napišite je, ili odgovorite \"preskoči\" ako nemate.",
    consentNotice:
      "Slanjem upita saglasni ste da se vaši podaci proslijede domaćinu kako bi mogao odgovoriti na vaš upit.",
    enquiryDisclaimer: "Ovo je upit, a ne potvrđena rezervacija.",
    confirmQuestion: "Da li da proslijedim ovaj upit domaćinu?",
    summaryHeading: "Evo šta imam — molimo provjerite:",
    summaryCheckIn: "Dolazak",
    summaryCheckOut: "Odlazak",
    summaryGuests: "Broj gostiju",
    summaryName: "Ime",
    summaryContact: "Kontakt",
    summaryNote: "Napomena",
    successHeading: "Hvala! Vaš upit je poslat.",
    successBody: "Domaćin će potvrditi dostupnost i javiti vam se u najkraćem roku.",
    referenceLabel: "Referenca",
    cancelled: "Nema problema — upit nije poslat. Javite mi ako želite ponovo da počnete.",
    errorDateFormat: "Nisam prepoznao/la taj datum. Koristite format poput 2026-06-10 ili 10.06.2026.",
    errorDatePast: "Taj datum izgleda da je u prošlosti. Unesite datum koji tek dolazi.",
    errorCheckoutRange: "Datum odlaska mora biti poslije datuma dolaska. Unesite kasniji datum.",
    errorGuests: "Unesite broj gostiju između 1 i 4.",
    errorName: "Unesite vaše ime i prezime.",
    errorContact: "Podijelite broj telefona, WhatsApp broj ili email kako bi vas domaćin mogao kontaktirati.",
  },
  ru: {
    intro:
      "Я не могу сама подтвердить наличие свободных дат — это может сделать только хозяин. Давайте начнём короткий запрос на бронирование, чтобы хозяин мог вам ответить. Какую дату заезда вы хотите? (например, 10.06.2026)",
    askCheckOut: "Спасибо! А дата выезда? (например, 14.06.2026)",
    askGuests: "Сколько гостей будет проживать? (1–4)",
    askName: "Как вас зовут (имя и фамилия)?",
    askContact: "Как лучше с вами связаться — телефон, WhatsApp или email?",
    askNote: "Есть пожелание для хозяина? Напишите его или ответьте «пропустить», если нет.",
    consentNotice:
      "Отправляя запрос, вы соглашаетесь на передачу ваших данных хозяину, чтобы он мог ответить на ваш запрос.",
    enquiryDisclaimer: "Это запрос, а не подтверждённое бронирование.",
    confirmQuestion: "Отправить этот запрос хозяину?",
    summaryHeading: "Вот что у меня есть — пожалуйста, проверьте:",
    summaryCheckIn: "Заезд",
    summaryCheckOut: "Выезд",
    summaryGuests: "Гостей",
    summaryName: "Имя",
    summaryContact: "Контакт",
    summaryNote: "Пожелание",
    successHeading: "Спасибо! Ваш запрос отправлен.",
    successBody: "Хозяин подтвердит наличие свободных дат и свяжется с вами как можно скорее.",
    referenceLabel: "Номер запроса",
    cancelled: "Хорошо — запрос не отправлен. Дайте знать, если захотите начать заново.",
    errorDateFormat: "Не удалось распознать дату. Используйте формат вроде 2026-06-10 или 10.06.2026.",
    errorDatePast: "Похоже, эта дата уже прошла. Укажите, пожалуйста, будущую дату.",
    errorCheckoutRange: "Дата выезда должна быть позже даты заезда. Укажите более позднюю дату.",
    errorGuests: "Пожалуйста, укажите количество гостей от 1 до 4.",
    errorName: "Пожалуйста, укажите ваше имя и фамилию.",
    errorContact: "Пожалуйста, укажите телефон, WhatsApp или email, чтобы хозяин мог с вами связаться.",
  },
};

export const HANDOFF_FLOW_TEXT: Record<
  Language,
  {
    intro: string;
    askQuestion: string;
    successHeading: string;
    successBody: string;
    referenceLabel: string;
    errorContact: string;
    errorQuestion: string;
  }
> = {
  en: {
    intro: "Sure — I can pass this on to the host directly. What's the best way to reach you (phone, WhatsApp or email)?",
    askQuestion: "Thanks! What would you like to ask the host?",
    successHeading: "Thanks! I've sent your question to the host.",
    successBody: "They'll get back to you as soon as possible.",
    referenceLabel: "Reference",
    errorContact: "Please share a phone number, WhatsApp number or email so the host can reach you.",
    errorQuestion: "Please type the question you'd like to send to the host.",
  },
  me: {
    intro: "Naravno — mogu ovo proslijediti direktno domaćinu. Koji je najbolji način da vas kontaktira (telefon, WhatsApp ili email)?",
    askQuestion: "Hvala! Šta biste željeli da pitate domaćina?",
    successHeading: "Hvala! Vaše pitanje je poslato domaćinu.",
    successBody: "Javiće vam se u najkraćem mogućem roku.",
    referenceLabel: "Referenca",
    errorContact: "Podijelite broj telefona, WhatsApp broj ili email kako bi vas domaćin mogao kontaktirati.",
    errorQuestion: "Napišite pitanje koje želite poslati domaćinu.",
  },
  ru: {
    intro: "Конечно — я передам это напрямую хозяину. Как лучше с вами связаться (телефон, WhatsApp или email)?",
    askQuestion: "Спасибо! Что бы вы хотели спросить у хозяина?",
    successHeading: "Спасибо! Ваш вопрос передан хозяину.",
    successBody: "Он свяжется с вами как можно скорее.",
    referenceLabel: "Номер запроса",
    errorContact: "Пожалуйста, укажите телефон, WhatsApp или email, чтобы хозяин мог с вами связаться.",
    errorQuestion: "Пожалуйста, напишите вопрос, который хотите передать хозяину.",
  },
};

/** Words that cancel an in-progress booking or hand-off flow. */
export const CANCEL_KEYWORDS: Record<Language, string[]> = {
  en: ["cancel", "stop", "never mind", "nevermind"],
  me: ["otkazi", "odustani", "prekini"],
  ru: ["отмена", "отменить", "стоп"],
};

export const CANCEL_CONFIRMATION: Record<Language, string> = {
  en: "No problem, I've cancelled that. How else can I help?",
  me: "Nema problema, otkazano je. Kako još mogu pomoći?",
  ru: "Хорошо, я отменил(а) это. Чем ещё могу помочь?",
};

/** Loose "skip" words accepted for the optional note step. */
export const SKIP_WORDS: Record<Language, string[]> = {
  en: ["skip", "no", "none", "-", "n/a"],
  me: ["preskoci", "ne", "nema", "-"],
  ru: ["пропустить", "нет", "-"],
};

/** Loose "yes" / "no" words accepted for confirmation steps. */
export const YES_WORDS: Record<Language, string[]> = {
  en: ["yes", "yep", "yeah", "sure", "confirm", "send"],
  me: ["da", "moze", "može", "potvrdjujem", "potvrđujem", "posalji", "pošalji"],
  ru: ["да", "давай", "отправить", "подтверждаю"],
};

export const NO_WORDS: Record<Language, string[]> = {
  en: ["no", "nope", "don't", "do not"],
  me: ["ne", "nemoj"],
  ru: ["нет", "не"],
};
