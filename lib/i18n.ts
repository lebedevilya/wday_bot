import type { Locale } from './types';

type Dict = Record<string, Record<Locale, string>>;

const dict: Dict = {
  pick_locale: {
    ru: 'Привет! Выбери язык 👋',
    en: 'Hi! Pick your language 👋',
    kk: 'Сәлем! Тілді таңда 👋',
  },
  pick_name: {
    ru: 'Кто ты? Найди себя в списке:',
    en: 'Who are you? Find yourself in the list:',
    kk: 'Сен кімсің? Тізімнен өзіңді тап:',
  },
  name_gone: {
    ru: 'Это имя уже занято. Выбери снова:',
    en: 'That name is already taken. Pick again:',
    kk: 'Бұл есім бос емес. Қайта таңда:',
  },
  joined: {
    ru: '🎉 Отлично, {name}! Ты в игре.',
    en: '🎉 Great, {name}! You are in the game.',
    kk: '🎉 Тамаша, {name}! Сен ойындасың.',
  },
  tasks_header: {
    ru: '📋 Твои задания (жми на кнопку, чтобы отправить фото):',
    en: '📋 Your tasks (tap a button to submit a photo):',
    kk: '📋 Сенің тапсырмаларың (фото жіберу үшін батырманы бас):',
  },
  task_done_mark: { ru: '✅', en: '✅', kk: '✅' },
  send_photo_now: {
    ru: '📸 Пришли фото для задания:\n«{task}»',
    en: '📸 Send a photo for the task:\n"{task}"',
    kk: '📸 Мына тапсырмаға фото жібер:\n«{task}»',
  },
  checking: {
    ru: '🔍 Проверяю фото...',
    en: '🔍 Checking your photo...',
    kk: '🔍 Фотоны тексеріп жатырмын...',
  },
  approved: {
    ru: '✅ Засчитано! +{points} 🎉 Всего очков: {total}',
    en: '✅ Approved! +{points} 🎉 Total points: {total}',
    kk: '✅ Есептелді! +{points} 🎉 Барлық ұпай: {total}',
  },
  rejected: {
    ru: '🤔 Хм, не похоже на выполненное задание. Попробуй еще раз — открой /tasks и пришли другое фото.',
    en: '🤔 Hmm, this does not look like the task was completed. Try again — open /tasks and send another photo.',
    kk: '🤔 Тапсырма орындалғанға ұқсамайды. Қайта көр — /tasks ашып, басқа фото жібер.',
  },
  score: {
    ru: '🏆 {name}: {points} очков.\n{prize}',
    en: '🏆 {name}: {points} points.\n{prize}',
    kk: '🏆 {name}: {points} ұпай.\n{prize}',
  },
  prize_current: {
    ru: 'Текущий приз: {prize} 🧸',
    en: 'Current prize: {prize} 🧸',
    kk: 'Қазіргі жүлде: {prize} 🧸',
  },
  prize_none: {
    ru: 'До приза не хватает очков — выполняй задания! 💪',
    en: 'Not enough points for a prize yet — keep doing tasks! 💪',
    kk: 'Жүлдеге ұпай жетпейді — тапсырмаларды орында! 💪',
  },
  wish_prompt: {
    ru: '💌 Напиши свое пожелание молодоженам одним сообщением:',
    en: '💌 Write your wish for the newlyweds in one message:',
    kk: '💌 Жас жұбайларға тілегіңді бір хабарламамен жаз:',
  },
  wish_saved: {
    ru: '💖 Спасибо! Пожелание сохранено и появится на сайте.',
    en: '💖 Thank you! Your wish is saved and will appear on the website.',
    kk: '💖 Рақмет! Тілегің сақталды және сайтта көрсетіледі.',
  },
  free_photo_prompt: {
    ru: '📷 Пришли любое фото с праздника — оно попадет на общую фотостену:',
    en: '📷 Send any photo from the party — it will appear on the shared photo wall:',
    kk: '📷 Тойдан кез келген фото жібер — ол ортақ фотоқабырғаға шығады:',
  },
  photo_saved: {
    ru: '🖼 Фото на стене! Смотри: {url}',
    en: '🖼 Photo is on the wall! See: {url}',
    kk: '🖼 Фото қабырғада! Қара: {url}',
  },
  not_joined: {
    ru: 'Сначала присоединись к игре: /start',
    en: 'Join the game first: /start',
    kk: 'Алдымен ойынға қосыл: /start',
  },
  no_names_left: {
    ru: 'Свободных имен не осталось. Подойди к Илье 🙂',
    en: 'No unclaimed names left. Find Ilya 🙂',
    kk: 'Бос есім қалмады. Ильяға барыңыз 🙂',
  },
  next_page: { ru: 'Дальше ▶️', en: 'Next ▶️', kk: 'Келесі ▶️' },
  prev_page: { ru: '◀️ Назад', en: '◀️ Back', kk: '◀️ Артқа' },

  // --- web version of the game (/play) ---
  play_title: { ru: 'Игра', en: 'The game', kk: 'Ойын' },
  play_intro: {
    ru: 'Фотозадания, очки и плюшевые призы. Найди себя в списке гостей:',
    en: 'Photo tasks, points and plush prizes. Find yourself in the guest list:',
    kk: 'Фототапсырмалар, ұпайлар және плюш жүлделер. Қонақтар тізімінен өзіңді тап:',
  },
  search_name: { ru: 'Твое имя…', en: 'Your name…', kk: 'Есіміңіз…' },
  nothing_found: { ru: 'Никого не нашли с таким именем', en: 'No one found with that name', kk: 'Мұндай есім табылмады' },
  name_taken: { ru: 'Это имя уже заняли. Выбери другое.', en: 'That name was just taken. Pick another.', kk: 'Бұл есімді алып қойды. Басқасын таңда.' },
  take_photo: { ru: 'Сделать фото', en: 'Take a photo', kk: 'Суретке түсіру' },
  retake: { ru: 'Еще раз', en: 'Try again', kk: 'Қайтадан' },
  my_points: { ru: 'Очков: {points}', en: '{points} points', kk: '{points} ұпай' },
  all_done: { ru: 'Все задания выполнены! 🎉 Иди за призом.', en: 'All tasks done! 🎉 Go get your prize.', kk: 'Барлық тапсырма орындалды! 🎉 Жүлдеңді ал.' },
  add_free_photo: { ru: 'Фото на стену', en: 'Photo to the wall', kk: 'Қабырғаға фото' },
  add_wish: { ru: 'Пожелание', en: 'Leave a wish', kk: 'Тілек жазу' },
  send: { ru: 'Отправить', en: 'Send', kk: 'Жіберу' },
  cancel: { ru: 'Отмена', en: 'Cancel', kk: 'Болдырмау' },
  saved: { ru: 'Готово! Смотри на фотостене.', en: 'Done! See it on the photo wall.', kk: 'Дайын! Фотоқабырғада қара.' },
  upload_failed: { ru: 'Не удалось отправить. Попробуй еще раз.', en: 'Upload failed. Try again.', kk: 'Жіберілмеді. Қайта көр.' },
  photo_too_big: { ru: 'Фото слишком большое.', en: 'That photo is too large.', kk: 'Фото тым үлкен.' },
  open_wall: { ru: 'Фотостена дня →', en: 'Live photo wall →', kk: 'Күннің фотоқабырғасы →' },
  prefer_telegram: { ru: 'Есть Telegram? Играй в боте', en: 'Have Telegram? Play in the bot', kk: 'Telegram бар ма? Ботта ойна' },
  help: {
    ru: 'Команды:\n/tasks — мои задания\n/score — мои очки и приз\n/wish — пожелание молодоженам\n/photo — загрузить фото на стену',
    en: 'Commands:\n/tasks — my tasks\n/score — my points and prize\n/wish — wish for the newlyweds\n/photo — upload a photo to the wall',
    kk: 'Командалар:\n/tasks — менің тапсырмаларым\n/score — ұпайларым мен жүлдем\n/wish — жас жұбайларға тілек\n/photo — қабырғаға фото жүктеу',
  },
};

export function t(locale: Locale, key: keyof typeof dict, vars: Record<string, string | number> = {}): string {
  let s = dict[key]?.[locale] ?? dict[key]?.ru ?? String(key);
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
