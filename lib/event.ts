// All invitation content in one place. Replace the TODO placeholders with real
// details — nothing else needs to change.
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
  // TODO: real venue + address + city
  venueName: { ru: 'Ресторан «TODO»', en: '“TODO” restaurant', kk: '«TODO» мейрамханасы' } as L,
  venueAddress: { ru: 'г. Город, ул. Адрес, 1', en: 'City, Address st., 1', kk: 'Қала, Мекенжай к-сі, 1' } as L,
  // TODO: real map link (2GIS / Google / Yandex)
  mapUrl: 'https://go.2gis.com/TODO',
  contactUrl: 'https://t.me/rubyminer',
  schedule: [
    { time: '16:00', label: { ru: 'Сбор гостей и игра', en: 'Guests arrive · the game', kk: 'Қонақтарды қарсы алу · ойын' } as L },
    { time: '18:00', label: { ru: 'Церемония', en: 'Ceremony', kk: 'Неке қию рәсімі' } as L },
    { time: '19:00', label: { ru: 'Банкет', en: 'Reception', kk: 'Банкет' } as L },
    { time: '21:00', label: { ru: 'Завершение вечера', en: 'End of the evening', kk: 'Кештің аяқталуы' } as L },
  ],
  ui: {
    rsvpTitle: { ru: 'Вы придете?', en: 'Will you join us?', kk: 'Келесіз бе?' } as L,
    rsvpFind: { ru: 'Найдите себя в списке гостей', en: 'Find yourself in the guest list', kk: 'Қонақтар тізімінен өзіңізді табыңыз' } as L,
    rsvpSearch: { ru: 'Ваше имя…', en: 'Your name…', kk: 'Есіміңіз…' } as L,
    rsvpYes: { ru: 'Я приду 💛', en: 'I will be there 💛', kk: 'Мен келемін 💛' } as L,
    rsvpNo: { ru: 'Не смогу', en: 'Can’t make it', kk: 'Келе алмаймын' } as L,
    rsvpParty: { ru: 'Сколько вас будет — вместе с детьми и второй половинкой?', en: 'How many of you — including kids and your plus-one?', kk: 'Балалар мен жұбайыңызбен қоса нешеу боласыздар?' } as L,
    rsvpYesN: { ru: 'Нас будет {n} — мы придем 💛', en: '{n} of us — we’ll be there 💛', kk: 'Біз {n} адам боламыз — келеміз 💛' } as L,
    rsvpSending: { ru: 'Отправляем…', en: 'Sending…', kk: 'Жіберілуде…' } as L,
    rsvpError: {
      ru: 'Не получилось отправить. Попробуйте еще раз или напишите нам:',
      en: 'Couldn’t send your answer. Try again or write to us:',
      kk: 'Жауап жіберілмеді. Қайта көріңіз немесе бізге жазыңыз:',
    } as L,
    rsvpNotFound: {
      ru: 'Не нашли себя в списке?',
      en: 'Can’t find your name?',
      kk: 'Тізімнен өзіңізді таппадыңыз ба?',
    } as L,
    rsvpWrite: { ru: 'Напишите нам', en: 'Write to us', kk: 'Бізге жазыңыз' } as L,
    rsvpRecorded: { ru: 'Записали: вас будет {n}', en: 'Noted: {n} of you', kk: 'Жазып алдық: {n} адам боласыздар' } as L,
    declineConfirm: { ru: 'Точно не сможете?', en: 'Sure you can’t make it?', kk: 'Шынымен келе алмайсыз ба?' } as L,
    back: { ru: 'Назад', en: 'Back', kk: 'Артқа' } as L,
    fewer: { ru: 'Меньше', en: 'Fewer', kk: 'Азырақ' } as L,
    more: { ru: 'Больше', en: 'More', kk: 'Көбірек' } as L,
    loading: { ru: 'Загружаем список…', en: 'Loading the list…', kk: 'Тізім жүктелуде…' } as L,
    rsvpThanksYes: { ru: 'Ждем вас! Мы очень рады 💛', en: 'Can’t wait to see you! 💛', kk: 'Күтеміз! Біз қуаныштымыз 💛' } as L,
    rsvpThanksNo: { ru: 'Жаль! Но спасибо, что предупредили 🤍', en: 'We’ll miss you! Thank you for letting us know 🤍', kk: 'Өкінішті! Хабарлағаныңызға рақмет 🤍' } as L,
    rsvpChange: { ru: 'Изменить ответ', en: 'Change answer', kk: 'Жауапты өзгерту' } as L,
    scheduleTitle: { ru: 'План дня', en: 'The day', kk: 'Күн тәртібі' } as L,
    whereTitle: { ru: 'Где', en: 'Where', kk: 'Қайда' } as L,
    openMap: { ru: 'Открыть карту', en: 'Open the map', kk: 'Картаны ашу' } as L,
    wallLink: { ru: 'Фотостена дня →', en: 'Live photo wall →', kk: 'Күннің фотоқабырғасы →' } as L,
    rsvpCta: { ru: 'Подтвердить присутствие', en: 'RSVP', kk: 'Қатысуды растау' } as L,
  },
};
