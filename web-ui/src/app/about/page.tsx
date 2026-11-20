'use client';

import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Sparkles,
  FileText,
  Microscope,
  CheckCircle2,
  Heart,
  Smile,
  Activity,
  Award,
} from 'lucide-react';
import { AppShell, useShellHeader } from '@/components/layout/AppShell';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { clinicApi } from '@/modules/clinic/api';
import type { Veterinarian } from '@/modules/clinic/types';
import type { Pet } from '@/modules/client/types';

interface PatientStory {
  id: string;
  name: string;
  species: string;
  speciesTone: string;
  breed: string;
  treatment: string;
  doctorName: string;
  doctorSpec: string;
  petData?: Pet;
}

const FEATURED_PATIENTS: PatientStory[] = [
  {
    id: '5eed0007-0000-0000-0000-000000000001',
    name: 'Рекс',
    species: 'Собака',
    speciesTone: 'dog',
    breed: 'Немецкая овчарка',
    treatment: 'Плановая кардиологическая диспансеризация и ЭхоКГ сердца',
    doctorName: 'Анна Сергеевна Иванова',
    doctorSpec: 'Ведущий терапевт',
  },
  {
    id: '5eed0007-0000-0000-0000-000000000689',
    name: 'Молли',
    species: 'Кошка',
    speciesTone: 'cat',
    breed: 'Британская короткошёрстная',
    treatment: 'Бережная санация ротовой полости и чипирование по стандартам Fear Free',
    doctorName: 'София Денисовна Орлова',
    doctorSpec: 'Ветеринарный стоматолог',
  },
  {
    id: '5eed0007-0000-0000-0000-000000000556',
    name: 'Барсик',
    species: 'Кролик',
    speciesTone: 'rabbit',
    breed: 'Декоративный карликовый кролик',
    treatment: 'Коррекция прикуса резцов и подбор специализированного лечебного рациона',
    doctorName: 'Алина Игоревна Зайцева',
    doctorSpec: 'Специалист по экзотическим животным',
  },
  {
    id: '5eed0007-0000-0000-0000-000000000801',
    name: 'Симба',
    species: 'Собака',
    speciesTone: 'dog',
    breed: 'Золотистый ретривер',
    treatment: 'Успешная малоинвазивная артроскопия и курс реабилитации сустава',
    doctorName: 'Роман Олегович Белов',
    doctorSpec: 'Хирург-ортопед',
  },
  {
    id: '5eed0007-0000-0000-0000-000000000154',
    name: 'Нюша',
    species: 'Кошка',
    speciesTone: 'cat',
    breed: 'Шотландская вислоухая',
    treatment: 'Ежегодный расширенный чекап здоровья и международный паспорт вакцинации',
    doctorName: 'Елена Викторовна Смирнова',
    doctorSpec: 'Терапевт, нефролог',
  },
  {
    id: '5eed0007-0000-0000-0000-000000000402',
    name: 'Феликс',
    species: 'Собака',
    speciesTone: 'dog',
    breed: 'Вельш-корги пемброк',
    treatment: 'Цифровой рентген позвоночника с минимальной дозой облучения',
    doctorName: 'Павел Николаевич Петров',
    doctorSpec: 'Хирург, травматолог',
  },
];

function AboutContent() {
  const [livePets, setLivePets] = useState<Record<string, Pet>>({});
  const [vetsCount, setVetsCount] = useState<number>(8);

  useShellHeader({
    crumbGroup: 'Клиника',
    crumb: 'О клинике Chiron',
  });

  useEffect(() => {
    // Подгрузка врачей из базы клиники
    clinicApi.getVeterinarians()
      .then((vets) => {
        if (Array.isArray(vets) && vets.length > 0) {
          setVetsCount(vets.length);
        }
      })
      .catch(() => {});

    // Подгружаем реальные фото питомцев клиники для витрины пациентов (доступно всем ролям без 403)
    fetch('/api/featured-pets')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.result)) {
          const map: Record<string, Pet> = {};
          for (const p of data.result) {
            map[p.id] = p;
            if (p.name) map[p.name.toLowerCase()] = p;
          }
          setLivePets(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="scroll-col grow pb-0">
      {/* Главный Hero-блок о клинике */}
      <section className="island hero-gradient flex-none p-card">
        <div className="col gap-2xl">
          <div className="row gap-xl items-center">
            <span className="feat-ic lg">
              <HeartPulse size={30} />
            </span>
            <div className="col gap-1">
              <h1 className="h1 text-2xl font-extrabold tracking-tight">
                Ветеринарная клиника Chiron
              </h1>
              <p className="muted text-base leading-snug">
                Современный ветеринарный госпиталь полного цикла и бережная цифровая экосистема
              </p>
            </div>
          </div>

          <p className="m-0 text-base leading-relaxed text-foreground max-w-prose opacity-90">
            Клиника <b>Chiron</b> создана командой практикующих ветеринарных врачей, чтобы объединить европейские протоколы доказательной медицины, бережные стандарты обращения без стресса (Fear Free) и абсолютную прозрачность для каждого владельца. Мы не применяем гомеопатию и препараты без доказанной эффективности, а каждое обследование и назначение фиксируется в защищённой цифровой медкарте.
          </p>

          {/* 4 ключевых индикатора клиники */}
          <div className="grid-stats mt-xs">
            <div className="stat-card">
              <span className="stat-value">{vetsCount} врачей</span>
              <span className="small muted">Терапевты, хирурги, стоматологи, ратологи</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">11 направлений</span>
              <span className="small muted">От плановой вакцинации до сложных операций</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">15 минут</span>
              <span className="small muted">Экспресс-анализы крови и микроскопия</span>
            </div>

            <div className="stat-card">
              <span className="stat-value">24 / 7</span>
              <span className="small muted">Приём экстренных пациентов и стационар</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Карточки ключевых преимуществ */}
      <div className="flex-none grid-features">
        <div className="island flex-none p-card col gap-base">
          <span className="feat-ic">
            <Stethoscope size={22} />
          </span>
          <span className="text-lg font-semibold">Врачи узких специализаций</span>
          <span className="muted text-sm leading-normal">
            Каждый доктор углублённо ведёт своё направление: абдоминальная и ортопедическая хирургия, ветеринарная стоматология, офтальмология и ратология.
          </span>
        </div>

        <div className="island flex-none p-card col gap-base">
          <span className="feat-ic">
            <Microscope size={22} />
          </span>
          <span className="text-lg font-semibold">Экспертная диагностика</span>
          <span className="muted text-sm leading-normal">
            Цифровой рентген высокого разрешения с минимальной лучевой нагрузкой, УЗИ экспертного класса (Mindray), ЭхоКГ сердца и собственная экспресс-лаборатория.
          </span>
        </div>

        <div className="island flex-none p-card col gap-base">
          <span className="feat-ic">
            <ShieldCheck size={22} />
          </span>
          <span className="text-lg font-semibold">Стандарты Fear Free</span>
          <span className="muted text-sm leading-normal">
            Атмосфера без стресса: раздельные зоны ожидания для кошек и собак, нескользящие тёплые столы осмотра, феромонотерапия и деликатная фиксация.
          </span>
        </div>

        <div className="island flex-none p-card col gap-base">
          <span className="feat-ic">
            <FileText size={22} />
          </span>
          <span className="text-lg font-semibold">Цифровая экосистема</span>
          <span className="muted text-sm leading-normal">
            Полная история визитов, протоколы назначений, результаты анализов и календарь обязательных ревакцинаций доступны владельцу в личном кабинете в 1 клик.
          </span>
        </div>
      </div>

      {/* 2 Больших блока: Клинические стандарты и Контакты/Режим работы */}
      <div className="flex-none grid-two-blocks">
        {/* Левый блок: Клинические стандарты доказательной заботы */}
        <section className="island flex-none p-card col">
          <div className="island-head p-0 min-h-0 border-0 mb-4">
            <span className="island-title text-xl">
              <Sparkles className="ic text-primary" size={20} />
              Принципы доказательной заботы
            </span>
          </div>

          <div className="col gap-xl">
            <div className="feat-row">
              <CheckCircle2 size={19} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Международные протоколы WSAVA и FECAVA</b>
                <span className="small muted leading-normal">
                  Назначения строго опираются на мировые стандарты ветеринарной медицины. Мы открыто обсуждаем план диагностики и лечения без навязанных услуг.
                </span>
              </div>
            </div>

            <div className="feat-row">
              <CheckCircle2 size={19} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Безопасная ингаляционная анестезия</b>
                <span className="small muted leading-normal">
                  Стерильный оперблок с аппаратом газового наркоза (изофлуран), кардиомониторингом жизненных показателей и непрерывным дежурством анестезиолога.
                </span>
              </div>
            </div>

            <div className="feat-row">
              <CheckCircle2 size={19} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Индивидуальный календарь здоровья</b>
                <span className="small muted leading-normal">
                  Схемы вакцинации и обработки от паразитов формируются с учётом возраста, породы и образа жизни питомца, а автоматические напоминания приходят заранее.
                </span>
              </div>
            </div>

            <div className="feat-row">
              <CheckCircle2 size={19} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Комфортный стационар с климат-контролем</b>
                <span className="small muted leading-normal">
                  Раздельное размещение кошек и собак в изолированных вентилируемых боксах с индивидуальным освещением для спокойного послеоперационного восстановления.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Правый блок: Контакты, адрес и график работы */}
        <section className="island flex-none p-card col">
          <div className="island-head p-0 min-h-0 border-0 mb-4">
            <span className="island-title text-xl">
              <Clock className="ic text-primary" size={20} />
              Контакты и режим приёма
            </span>
          </div>

          <div className="col gap-xl">
            <div className="feat-row">
              <MapPin size={20} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Адрес клиники</b>
                <span className="muted text-sm">
                  г. Ростов-на-Дону, ул. Пушкинская, д. 115
                </span>
                <span className="small muted">
                  Удобный подъезд с ул. Пушкинской, собственная парковка для посетителей клиники
                </span>
              </div>
            </div>

            <div className="feat-row">
              <Clock size={20} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">График приёма</b>
                <span className="muted text-sm">
                  Плановый приём врачей: <b>ежедневно с 08:00 до 22:00</b>
                </span>
                <span className="small font-semibold text-primary">
                  Приём экстренных пациентов и стационар: <b>круглосуточно (24/7)</b>
                </span>
              </div>
            </div>

            <div className="feat-row">
              <Phone size={20} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Телефоны регистратуры</b>
                <span className="muted text-sm">
                  +7 (863) 200-55-90 (многоканальный)
                </span>
                <span className="small muted">
                  +7 (928) 111-22-33 (дежурный врач и экстренная линия)
                </span>
              </div>
            </div>

            <div className="feat-row">
              <Mail size={20} className="text-primary shrink-0 mt-xs" />
              <div className="col gap-1">
                <b className="text-base">Электронная почта и реквизиты</b>
                <span className="muted text-sm">
                  care@chiron.clinic · reception@chiron.clinic
                </span>
                <span className="small muted">
                  ООО «Ветеринарный госпиталь Хирон», Лицензия № ЛО-61-02-004812
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Дружелюбная творческая витрина: «Пациенты и врачи клиники» */}
      <section className="island flex-none p-card">
        <div className="col gap-2xl">
          <div className="row wrap between items-center gap-lg">
            <div className="row gap-base items-center">
              <span className="feat-ic sm">
                <Heart size={20} />
              </span>
              <div className="col gap-1">
                <span className="text-xl font-bold">
                  Счастливые пациенты Chiron
                </span>
                <span className="small muted">
                  Примеры питомцев из нашей базы данных и врачи, которые заботятся об их здоровье
                </span>
              </div>
            </div>

            <div className="row gap-xl">
              <span className="small muted inline-flex items-center gap-sm">
                <Smile size={15} className="text-primary" />
                Более 1 400 здоровых питомцев
              </span>
              <span className="small muted inline-flex items-center gap-sm">
                <Award size={15} className="text-primary" />
                Сертифицированные врачи
              </span>
            </div>
          </div>

          <div className="grid-patients">
            {FEATURED_PATIENTS.map((p) => {
              const petFromDb = livePets[p.id] || livePets[p.name.toLowerCase()];
              return (
                <div key={p.id} className="patient-card">
                  <div className="row gap-lg items-center">
                    <PetAvatar
                      pet={petFromDb || { id: p.id, name: p.name }}
                      tone={p.speciesTone}
                      species={p.speciesTone as any}
                      iconSize={22}
                      className="t-ava md round"
                    />
                    <div className="col gap-1 flex-1 min-w-0">
                      <div className="row gap-md items-center">
                        <b className="text-base">{p.name}</b>
                        <span className={`sp-chip tone-${p.speciesTone} px-sm text-xs`}>
                          {p.species}
                        </span>
                      </div>
                      <span className="small muted truncate">
                        {p.breed}
                      </span>
                    </div>
                  </div>

                  <div className="patient-card-treatment">
                    {p.treatment}
                  </div>

                  <div className="row gap-md items-center text-xs text-muted mt-auto pt-1">
                    <Stethoscope size={14} className="text-primary shrink-0" />
                    <span>
                      Лечащий врач: <b className="text-foreground">{p.doctorName}</b>
                      <span className="muted"> ({p.doctorSpec})</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AboutPage() {
  return (
    <AppShell>
      <AboutContent />
    </AppShell>
  );
}
