-- wday seed: settings, core task pool, generic person-task template, fake test guests.
-- Replace test guests with the real list via the admin panel.

insert into settings (id, data) values (1, '{
  "core_tasks_per_player": 4,
  "person_tasks_per_player": 5,
  "prize_tiers": [
    {"min_points": 9, "prize": {"ru": "Большая плюшевая игрушка", "en": "Large plush toy", "kk": "Үлкен плюш ойыншық"}},
    {"min_points": 6, "prize": {"ru": "Средняя плюшевая игрушка", "en": "Medium plush toy", "kk": "Орташа плюш ойыншық"}}
  ]
}') on conflict (id) do update set data = excluded.data;

-- The single generic person-task template ({name} replaced per assignment).
insert into task_templates (kind, title, points) values
('person', '{"ru": "Сделай фото с {name}", "en": "Take a photo with {name}", "kk": "{name} есімді қонақпен бірге суретке түс"}', 1);

-- Core task pool (no fixed target; add "photo with <specific guest>" ones in admin
-- with kind=core + target_guest_id once real guests are loaded).
insert into task_templates (kind, title, points) values
('core', '{"ru": "Сделай фото с Ильей", "en": "Take a photo with Ilya", "kk": "Ильямен бірге суретке түс"}', 1),
('core', '{"ru": "Сделай фото с Айгуль", "en": "Take a photo with Aigul", "kk": "Айгүлмен бірге суретке түс"}', 1),
('core', '{"ru": "Сделай фото с женихом и невестой вместе", "en": "Take a photo with the newlyweds together", "kk": "Күйеу мен қалыңдықпен бірге суретке түс"}', 2),
('core', '{"ru": "Напиши пожелание в книге пожеланий и сфотографируй страницу", "en": "Write a wish in the wishes book and photograph the page", "kk": "Тілек кітабына тілек жазып, бетті суретке түсір"}', 2),
('core', '{"ru": "Сделай селфи с тремя гостями, которых ты не знал(а) до сегодня", "en": "Take a selfie with three guests you did not know before today", "kk": "Бүгінге дейін танымаған үш қонақпен селфи жаса"}', 2),
('core', '{"ru": "Сделай фото у фотозоны", "en": "Take a photo at the photo zone", "kk": "Фотоаймақта суретке түс"}', 1),
('core', '{"ru": "Сфотографируйся с самым нарядным гостем", "en": "Take a photo with the best-dressed guest", "kk": "Ең сәнді киінген қонақпен суретке түс"}', 1),
('core', '{"ru": "Сделай фото с гостем из другого города", "en": "Take a photo with a guest from another city", "kk": "Басқа қаладан келген қонақпен суретке түс"}', 1),
('core', '{"ru": "Сделай смешное фото с любым ребенком", "en": "Take a funny photo with any kid", "kk": "Кез келген баламен күлкілі сурет жаса"}', 1),
('core', '{"ru": "Сделай фото, где все за твоим столом машут в камеру", "en": "Take a photo where everyone at your table waves at the camera", "kk": "Үстеліңдегі барлық қонақ камераға қол бұлғап тұрған сурет жаса"}', 1),
('core', '{"ru": "Сделай танцевальное фото с другим гостем", "en": "Take a dancing photo with another guest", "kk": "Басқа қонақпен билеп жатқан сурет жаса"}', 1),
('core', '{"ru": "Сделай фото-повтор любой позы жениха и невесты с их фотографий", "en": "Recreate any pose from the newlyweds'' photos", "kk": "Жас жұбайлардың суреттеріндегі кез келген позаны қайталап суретке түс"}', 2);

-- Fake guests for local testing (delete before the real event).
insert into guests (name, grp, status) values
('Тест Кирилл', 'ilya_friends', 'inactive'),
('Тест Денис', 'ilya_friends', 'inactive'),
('Тест Алтынбек', 'aigul_family', 'inactive'),
('Тест Акмарал', 'aigul_friends', 'inactive'),
('Тест Медет', 'aigul_friends', 'inactive'),
('Тест Мама Ильи', 'ilya_family', 'target'),
('Тест Хан-Султан', 'kids', 'target');
