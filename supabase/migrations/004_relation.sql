-- Free-text "who is this" descriptor: "мама Ильи", "тётя Айгуль", "друг Ильи с универа".
-- Names alone don't help a guest from the other side of the family, and person-tasks
-- deliberately pair strangers, so the task text needs this to be doable.
alter table guests add column relation text;
