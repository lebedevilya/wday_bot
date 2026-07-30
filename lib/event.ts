// All invitation content in one place: names, date, schedule, venue, UI strings.
// Edit here and every locale of the invitation follows — nothing else to change.
import type { Locale } from './types';

type L<T = string> = Record<Locale, T>;

export const EVENT = {
  names: { ru: 'Илья и Айгуль', en: 'Ilya & Aigul', kk: 'Илья мен Айгүл' } as L,
  dateLine: { ru: '8 августа 2026', en: 'August 8, 2026', kk: '2026 жылғы 8 тамыз' } as L,
  inviteLine: {
    ru: 'Мы женимся — и очень хотим разделить этот день с вами',
    en: 'We are getting married — and we would love to share this day with you',
    kk: 'Біз үйленеміз — осы күнді сіздермен бөліскіміз келеді',
  } as L,
  venueName: { ru: 'Tau Resort', en: 'Tau Resort', kk: 'Tau Resort' } as L,
  venueAddress: {
    ru: 'ул. Жамбыла Жабаева, 21, с. Бескайнар, Талгарский район, Алматинская область',
    en: '21 Zhambyl Zhabayev St., Beskainar, Talgar District, Almaty Region',
    kk: 'Жамбыл Жабаев көшесі, 21, Бесқайнар ауылы, Талғар ауданы, Алматы облысы',
  } as L,
  mapUrl: 'https://2gis.kz/almaty/geo/70000001038194574/77.098419,43.219823',
  contactUrl: 'https://t.me/rubyminer',
  schedule: [
    { time: '17:00', label: { ru: 'Сбор гостей и игра', en: 'Guests arrive · the game', kk: 'Қонақтарды қарсы алу · ойын' } as L },
    { time: '19:00', label: { ru: 'Церемония', en: 'Ceremony', kk: 'Неке қию рәсімі' } as L },
    { time: '19:30', label: { ru: 'Банкет', en: 'Reception', kk: 'Банкет' } as L },
    { time: '22:00', label: { ru: 'Завершение вечера', en: 'End of the evening', kk: 'Кештің аяқталуы' } as L },
    { time: '23:00', label: { ru: 'Afterparty', en: 'Afterparty', kk: 'Afterparty' } as L },
  ],
  faq: [
    {
      q: { ru: 'Какой дресс-код?', en: 'Is there a dress code?', kk: 'Дресс-код қандай?' } as L,
      a: {
        ru: 'Фиксированного дресс-кода нет — приходите в том, в чём вам комфортно и красиво. Днём ожидается +25–30, но площадка в горах, и после заката заметно холодает: возьмите с собой кофту или куртку.',
        en: 'No fixed dress code — wear whatever feels good on you. Daytime should be around +25–30 °C, but the venue is in the mountains and it cools down noticeably after sunset, so bring a jumper or a jacket.',
        kk: 'Белгіленген дресс-код жоқ — өзіңізге жайлы киімде келіңіз. Күндіз +25–30 болады, бірақ алаң тауда, күн батқан соң салқындайды: жылы киім алып жүріңіз.',
      } as L,
    },
    {
      q: { ru: 'Как добраться?', en: 'How do I get there?', kk: 'Қалай жетуге болады?' } as L,
      a: {
        ru: 'Площадка за городом, и общественным транспортом добраться почти невозможно. Если вы без машины — отметьте «нужен трансфер» при подтверждении присутствия, и мы увезём вас на одной из машин.',
        en: 'The venue is outside the city and public transport is practically not an option. If you don’t have a car, tick “I need a transfer” when you RSVP and we’ll get you there in one of ours.',
        kk: 'Алаң қала сыртында, қоғамдық көлікпен жету мүмкін емес деуге болады. Көлігіңіз болмаса, қатысуды растаған кезде «трансфер керек» деп белгілеңіз — біз жеткізіп саламыз.',
      } as L,
    },
    {
      q: { ru: 'До скольки всё продлится?', en: 'How late does it go?', kk: 'Қашанға дейін созылады?' } as L,
      a: {
        ru: 'Официальная часть закончится около 22:00. Дальше — неофициальная, и она может продлиться до утра.',
        en: 'The official part wraps up around 22:00. After that it’s the unofficial part, which may well run until morning.',
        kk: 'Ресми бөлім шамамен 22:00-де бітеді. Одан кейін бейресми бөлім — таңға дейін жалғасуы мүмкін.',
      } as L,
    },
    {
      q: { ru: 'Что будет после официальной части?', en: 'What happens after the official part?', kk: 'Ресми бөлімнен кейін не болады?' } as L,
      a: {
        ru: 'Будем отдыхать: на территории есть мангал, баня, купель и бильярд.',
        en: 'We’ll just relax — there’s a barbecue, a banya, a plunge pool and a billiard table on site.',
        kk: 'Демаламыз: аумақта мангал, монша, бассейн және бильярд бар.',
      } as L,
    },
    {
      q: { ru: 'Можно остаться на ночь?', en: 'Can I stay the night?', kk: 'Түнеп қалуға бола ма?' } as L,
      a: {
        ru: 'Да, в доме 26 спальных мест. Если планируете остаться — скажите нам заранее, чтобы мы всех разместили.',
        en: 'Yes — there are 26 beds in the house. Let us know in advance if you’re planning to stay, so we can fit everyone in.',
        kk: 'Иә, үйде 26 орын бар. Қалғыңыз келсе, бәрін орналастыру үшін алдын ала айтыңыз.',
      } as L,
    },
    {
      q: { ru: 'Что взять с собой?', en: 'What should I bring?', kk: 'Өзіммен не алуым керек?' } as L,
      a: {
        ru: 'Если только на официальную часть — кофту или куртку на случай прохладного вечера. Если с ночёвкой — купальные принадлежности, полотенце и сменную одежду.',
        en: 'Just for the official part: a jumper or jacket in case the evening turns cool. Staying over: swimwear, a towel and a change of clothes.',
        kk: 'Тек ресми бөлімге келсеңіз — салқын кеш үшін жылы киім. Түнеп қалсаңыз — шомылатын киім, сүлгі және ауыстыратын киім.',
      } as L,
    },
    {
      q: { ru: 'Можно с детьми?', en: 'Can I bring my kids?', kk: 'Балаларымды алып келуге бола ма?' } as L,
      a: {
        ru: 'Конечно, детям будем рады. Укажите, сколько их, когда подтверждаете присутствие — так мы всё посчитаем заранее.',
        en: 'Of course, kids are very welcome. Just tell us how many when you RSVP so we can plan for them.',
        kk: 'Әрине, балаларға қуаныштымыз. Қатысуды растаған кезде нешеу екенін жазыңыз — бәрін алдын ала есептейміз.',
      } as L,
    },
    {
      q: { ru: 'А если я опоздаю?', en: 'What if I’m running late?', kk: 'Кешігіп қалсам не болады?' } as L,
      a: {
        ru: 'Ничего страшного — приезжайте, когда сможете. Главное, постарайтесь успеть к церемонии в 19:00.',
        en: 'No problem at all — come when you can. Just try to make it for the ceremony at 19:00.',
        kk: 'Ештеңе етпейді — қолыңыз бос болғанда келіңіз. Тек 19:00-дегі рәсімге үлгеруге тырысыңыз.',
      } as L,
    },
    {
      q: { ru: 'Планы изменились — что делать?', en: 'My plans changed — what now?', kk: 'Жоспарым өзгерді — не істеймін?' } as L,
      a: {
        ru: 'Просто напишите нам в Telegram, мы всё поправим. Лучше знать заранее, чем ждать вас зря.',
        en: 'Just message us on Telegram and we’ll update everything. We’d much rather know in advance than wait for you.',
        kk: 'Бізге Telegram-ға жазыңыз, бәрін түзетеміз. Күтіп қалғаннан гөрі, алдын ала білгеніміз жақсы.',
      } as L,
    },
  ],
  ui: {
    rsvpTitle: { ru: 'Вы придете?', en: 'Will you join us?', kk: 'Келесіз бе?' } as L,
    rsvpAskName: { ru: 'Как вас зовут?', en: 'What is your name?', kk: 'Атыңыз кім?' } as L,
    rsvpSearch: { ru: 'Имя и фамилия', en: 'Name and surname', kk: 'Аты-жөніңіз' } as L,
    rsvpNext: { ru: 'Дальше', en: 'Next', kk: 'Әрі қарай' } as L,
    rsvpSkip: { ru: 'Пропустить', en: 'Skip', kk: 'Өткізіп жіберу' } as L,
    // who is coming
    rsvpWho: { ru: 'Вы придете одни или с парой?', en: 'Are you coming alone or with your partner?', kk: 'Жалғыз келесіз бе, жұбыңызбен бе?' } as L,
    rsvpAlone: { ru: 'Я один(а)', en: 'On my own', kk: 'Жалғыз' } as L,
    rsvpWithPair: { ru: 'С парой', en: 'With my partner', kk: 'Жұбыммен' } as L,
    rsvpPairName: { ru: 'Имя вашей пары', en: 'Your partner’s name', kk: 'Жұбыңыздың есімі' } as L,
    rsvpKids: { ru: 'Дети с вами? (если нет — оставьте 0)', en: 'Bringing kids? (leave 0 if not)', kk: 'Балалармен келесіз бе? (жоқ болса — 0)' } as L,
    rsvpKidsN: { ru: 'детей: {n}', en: 'kids: {n}', kk: 'бала: {n}' } as L,
    // photo
    rsvpPhotoTitle: { ru: 'Загрузите фото', en: 'Upload a photo', kk: 'Фото жүктеңіз' } as L,
    rsvpPhotoWhySolo: {
      ru: 'Оно понадобится нам для игры на празднике. Убедитесь, что лицо хорошо видно.',
      en: 'We need it for the party game. Please make sure your face is clearly visible.',
      kk: 'Ол тойдағы ойын үшін керек. Бет анық көрінетініне көз жеткізіңіз.',
    } as L,
    rsvpPhotoWhyPair: {
      ru: 'Фото вас двоих — оно понадобится нам для игры на празднике. Убедитесь, что оба лица хорошо видны.',
      en: 'A photo of the two of you — we need it for the party game. Please make sure both faces are clearly visible.',
      kk: 'Екеуіңіздің фотосы — ол тойдағы ойын үшін керек. Екі бет те анық көрінсін.',
    } as L,
    rsvpPickPhoto: { ru: 'Выбрать фото', en: 'Choose a photo', kk: 'Фото таңдау' } as L,
    rsvpCropHint: { ru: 'Двигайте фото и меняйте масштаб, чтобы лица попали в кадр', en: 'Drag the photo and zoom so the faces fit the frame', kk: 'Беттер кадрға түсуі үшін фотоны жылжытып, масштабты өзгертіңіз' } as L,
    rsvpZoom: { ru: 'Масштаб', en: 'Zoom', kk: 'Масштаб' } as L,
    rsvpOtherPhoto: { ru: 'Другое фото', en: 'Another photo', kk: 'Басқа фото' } as L,
    rsvpPhotoTooBig: { ru: 'Фото слишком большое — выберите другое.', en: 'That photo is too large — pick another.', kk: 'Фото тым үлкен — басқасын таңдаңыз.' } as L,
    // arrival
    rsvpArrivalTitle: { ru: 'Во сколько вас ждать?', en: 'When should we expect you?', kk: 'Сізді қашан күтейік?' } as L,
    rsvpArrivalHint: { ru: 'Примерно — просто чтобы мы вас не потеряли', en: 'Roughly — just so we don’t lose you', kk: 'Шамамен — сізді жоғалтпау үшін' } as L,
    rsvpCeremonyNote: { ru: 'к церемонии', en: 'for the ceremony', kk: 'рәсімге' } as L,
    rsvpTransfer: {
      ru: 'У меня нет машины — нужен трансфер',
      en: 'I don’t have a car — I need a transfer',
      kk: 'Менде көлік жоқ — трансфер керек',
    } as L,
    rsvpTransferHint: {
      ru: 'Мы организуем трансфер из города, поэтому нам важно знать заранее',
      en: 'We are arranging a transfer from the city, so it helps to know in advance',
      kk: 'Қаладан трансфер ұйымдастырамыз, сондықтан алдын ала білгеніміз жақсы',
    } as L,
    // done
    rsvpCalendar: { ru: 'Добавить в Google Календарь', en: 'Add to Google Calendar', kk: 'Google Күнтізбесіне қосу' } as L,
    rsvpBot: { ru: 'Подписаться на бота', en: 'Subscribe to the bot', kk: 'Ботқа жазылу' } as L,
    rsvpBotWhy: {
      ru: 'Там будет всё про день: расписание, фото и сюрпризы',
      en: 'It will have everything about the day: schedule, photos and surprises',
      kk: 'Онда күн туралы бәрі болады: кесте, фото және тосынсыйлар',
    } as L,
    rsvpYes: { ru: 'Я приду 💛', en: 'I will be there 💛', kk: 'Мен келемін 💛' } as L,
    rsvpNo: { ru: 'Не смогу', en: 'Can’t make it', kk: 'Келе алмаймын' } as L,
    rsvpYesN: { ru: 'Нас будет {n} — мы придем 💛', en: '{n} of us — we’ll be there 💛', kk: 'Біз {n} адам боламыз — келеміз 💛' } as L,
    rsvpSending: { ru: 'Отправляем…', en: 'Sending…', kk: 'Жіберілуде…' } as L,
    rsvpError: {
      ru: 'Не получилось отправить. Попробуйте еще раз или напишите нам:',
      en: 'Couldn’t send your answer. Try again or write to us:',
      kk: 'Жауап жіберілмеді. Қайта көріңіз немесе бізге жазыңыз:',
    } as L,
    rsvpNotFound: { ru: 'Вопросы?', en: 'Questions?', kk: 'Сұрақтар бар ма?' } as L,
    rsvpWrite: { ru: 'Напишите нам', en: 'Write to us', kk: 'Бізге жазыңыз' } as L,
    rsvpRecorded: { ru: 'Записали: вас будет {n}', en: 'Noted: {n} of you', kk: 'Жазып алдық: {n} адам боласыздар' } as L,
    declineConfirm: { ru: 'Точно не сможете?', en: 'Sure you can’t make it?', kk: 'Шынымен келе алмайсыз ба?' } as L,
    back: { ru: 'Назад', en: 'Back', kk: 'Артқа' } as L,
    fewer: { ru: 'Меньше', en: 'Fewer', kk: 'Азырақ' } as L,
    more: { ru: 'Больше', en: 'More', kk: 'Көбірек' } as L,
    rsvpThanksYes: { ru: 'Ждем вас! Мы очень рады 💛', en: 'Can’t wait to see you! 💛', kk: 'Күтеміз! Біз қуаныштымыз 💛' } as L,
    rsvpThanksNo: { ru: 'Жаль! Но спасибо, что предупредили 🤍', en: 'We’ll miss you! Thank you for letting us know 🤍', kk: 'Өкінішті! Хабарлағаныңызға рақмет 🤍' } as L,
    rsvpChange: { ru: 'Изменить ответ', en: 'Change answer', kk: 'Жауапты өзгерту' } as L,
    scheduleTitle: { ru: 'План дня', en: 'The day', kk: 'Күн тәртібі' } as L,
    whereTitle: { ru: 'Где', en: 'Where', kk: 'Қайда' } as L,
    openMap: { ru: 'Открыть карту', en: 'Open the map', kk: 'Картаны ашу' } as L,
    rsvpCta: { ru: 'Подтвердить присутствие', en: 'RSVP', kk: 'Қатысуды растау' } as L,
    faqTitle: { ru: 'Частые вопросы', en: 'Common questions', kk: 'Жиі қойылатын сұрақтар' } as L,
  },
};

export const BOT_URL = 'https://t.me/aigul_ilya_bot?start=rsvp';

// Google Calendar accepts an unzoned time plus ctz, so we never have to hardcode
// Kazakhstan's UTC offset (it changed in 2024 — Almaty is UTC+5 now, not +6).
export function calendarUrl(locale: Locale): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: locale === 'ru' ? 'Свадьба Ильи и Айгуль' : locale === 'kk' ? 'Илья мен Айгүлдің тойы' : 'Ilya & Aigul’s wedding',
    dates: '20260808T170000/20260808T230000',
    ctz: 'Asia/Almaty',
    location: `${EVENT.venueName[locale]}, ${EVENT.venueAddress[locale]}`,
    details: EVENT.mapUrl,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
