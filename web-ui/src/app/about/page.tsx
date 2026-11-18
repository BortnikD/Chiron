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
    <div className="scroll-col grow" style={{ gap: 'var(--gap)', paddingBottom: 'var(--gap)' }}>
      {/* Главный Hero-блок о клинике без лишних кнопок в правом углу */}
      <section
        className="island"
        style={{
          flex: 'none',
          padding: '24px',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)) 0%, var(--card) 60%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="col" style={{ gap: '18px' }}>
          <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
            <span
              className="t-ava xl round"
              style={{
                width: '56px',
                height: '56px',
                background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                color: 'var(--primary)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <HeartPulse size={30} />
            </span>
            <div className="col" style={{ gap: '3px' }}>
              <span className="h1" style={{ fontSize: '24px', fontWeight: 750, letterSpacing: '-0.02em' }}>
                Ветеринарная клиника Chiron
              </span>
              <span className="muted" style={{ fontSize: '14.5px', lineHeight: 1.4 }}>
                Современный ветеринарный госпиталь полного цикла и бережная цифровая экосистема
              </span>
            </div>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '14.5px',
              lineHeight: 1.6,
              color: 'var(--foreground)',
              maxWidth: '960px',
              opacity: 0.92,
            }}
          >
            Клиника <b>Chiron</b> создана командой практикующих ветеринарных врачей, чтобы объединить европейские протоколы доказательной медицины, бережные стандарты обращения без стресса (Fear Free) и абсолютную прозрачность для каждого владельца. Мы не применяем гомеопатию и препараты без доказанной эффективности, а каждое обследование и назначение фиксируется в защищённой цифровой медкарте.
          </p>

          {/* 4 ключевых индикатора клиники */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--gap)',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--card) 65%, transparent)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 750, color: 'var(--primary)' }}>
                {vetsCount} врачей
              </span>
              <span className="small muted">Терапевты, хирурги, стоматологи, ратологи</span>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--card) 65%, transparent)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 750, color: 'var(--primary)' }}>
                11 направлений
              </span>
              <span className="small muted">От плановой вакцинации до сложных операций</span>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--card) 65%, transparent)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 750, color: 'var(--primary)' }}>
                15 минут
              </span>
              <span className="small muted">Экспресс-анализы крови и микроскопия</span>
            </div>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--card) 65%, transparent)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 750, color: 'var(--primary)' }}>
                24 / 7
              </span>
              <span className="small muted">Приём экстренных пациентов и стационар</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Карточки ключевых преимуществ «под линеечку» */}
      <div
        style={{
          flex: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--gap)',
        }}
      >
        <div
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Stethoscope size={22} />
          </span>
          <span style={{ fontSize: '16.5px', fontWeight: 650 }}>Врачи узких специализаций</span>
          <span className="muted" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            Каждый доктор углублённо ведёт своё направление: абдоминальная и ортопедическая хирургия, ветеринарная стоматология, офтальмология и ратология.
          </span>
        </div>

        <div
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Microscope size={22} />
          </span>
          <span style={{ fontSize: '16.5px', fontWeight: 650 }}>Экспертная диагностика</span>
          <span className="muted" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            Цифровой рентген высокого разрешения с минимальной лучевой нагрузкой, УЗИ экспертного класса (Mindray), ЭхоКГ сердца и собственная экспресс-лаборатория.
          </span>
        </div>

        <div
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </span>
          <span style={{ fontSize: '16.5px', fontWeight: 650 }}>Стандарты Fear Free</span>
          <span className="muted" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            Атмосфера без стресса: раздельные зоны ожидания для кошек и собак, нескользящие тёплые столы осмотра, феромонотерапия и деликатная фиксация.
          </span>
        </div>

        <div
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <FileText size={22} />
          </span>
          <span style={{ fontSize: '16.5px', fontWeight: 650 }}>Цифровая экосистема</span>
          <span className="muted" style={{ fontSize: '13.5px', lineHeight: 1.55 }}>
            Полная история визитов, протоколы назначений, результаты анализов и календарь обязательных ревакцинаций доступны владельцу в личном кабинете в 1 клик.
          </span>
        </div>
      </div>

      {/* 2 Больших блока «под линеечку»: Клинические стандарты и Контакты/Режим работы */}
      <div
        style={{
          flex: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--gap)',
        }}
      >
        {/* Левый блок: Клинические стандарты доказательной заботы */}
        <section
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="island-head" style={{ marginBottom: '16px', padding: 0, minHeight: 'auto', border: 0 }}>
            <span className="island-title" style={{ fontSize: '18px' }}>
              <Sparkles className="ic text-primary" size={20} />
              Принципы доказательной заботы
            </span>
          </div>

          <div className="col" style={{ gap: '16px' }}>
            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={19} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Международные протоколы WSAVA и FECAVA</b>
                <span className="small muted" style={{ lineHeight: 1.5 }}>
                  Назначения строго опираются на мировые стандарты ветеринарной медицины. Мы открыто обсуждаем план диагностики и лечения без навязанных услуг.
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={19} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Безопасная ингаляционная анестезия</b>
                <span className="small muted" style={{ lineHeight: 1.5 }}>
                  Стерильный оперблок с аппаратом газового наркоза (изофлуран), кардиомониторингом жизненных показателей и непрерывным дежурством анестезиолога.
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={19} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Индивидуальный календарь здоровья</b>
                <span className="small muted" style={{ lineHeight: 1.5 }}>
                  Схемы вакцинации и обработки от паразитов формируются с учётом возраста, породы и образа жизни питомца, а автоматические напоминания приходят заранее.
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={19} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Комфортный стационар с климат-контролем</b>
                <span className="small muted" style={{ lineHeight: 1.5 }}>
                  Раздельное размещение кошек и собак в изолированных вентилируемых боксах с индивидуальным освещением для спокойного послеоперационного восстановления.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Правый блок: Контакты, адрес и график работы */}
        <section
          className="island"
          style={{
            flex: 'none',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="island-head" style={{ marginBottom: '16px', padding: 0, minHeight: 'auto', border: 0 }}>
            <span className="island-title" style={{ fontSize: '18px' }}>
              <Clock className="ic text-primary" size={20} />
              Контакты и режим приёма
            </span>
          </div>

          <div className="col" style={{ gap: '16px' }}>
            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <MapPin size={20} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Адрес клиники</b>
                <span className="muted" style={{ fontSize: '14px' }}>
                  г. Ростов-на-Дону, ул. Пушкинская, д. 115
                </span>
                <span className="small muted">
                  Удобный подъезд с ул. Пушкинской, собственная парковка для посетителей клиники
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <Clock size={20} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>График приёма</b>
                <span className="muted" style={{ fontSize: '14px' }}>
                  Плановый приём врачей: <b>ежедневно с 08:00 до 22:00</b>
                </span>
                <span className="small" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Приём экстренных пациентов и стационар: <b>круглосуточно (24/7)</b>
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <Phone size={20} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Телефоны регистратуры</b>
                <span className="muted" style={{ fontSize: '14px' }}>
                  +7 (863) 200-55-90 (многоканальный)
                </span>
                <span className="small muted">
                  +7 (928) 111-22-33 (дежурный врач и экстренная линия)
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
              <Mail size={20} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="col" style={{ gap: '2px' }}>
                <b style={{ fontSize: '14.5px' }}>Электронная почта и реквизиты</b>
                <span className="muted" style={{ fontSize: '14px' }}>
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

      {/* Дружелюбная творческая витрина: «Пациенты и врачи клиники» вместо скучного меню */}
      <section className="island" style={{ flex: 'none', padding: '24px' }}>
        <div className="col" style={{ gap: '18px' }}>
          <div className="row wrap between" style={{ alignItems: 'center', gap: '12px' }}>
            <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
                  color: 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Heart size={20} />
              </span>
              <div className="col" style={{ gap: '2px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>
                  Счастливые пациенты Chiron
                </span>
                <span className="small muted">
                  Примеры питомцев из нашей базы данных и врачи, которые заботятся об их здоровье
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: '16px' }}>
              <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Smile size={15} className="text-primary" />
                Более 1 400 здоровых питомцев
              </span>
              <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} className="text-primary" />
                Сертифицированные врачи
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--gap)',
            }}
          >
            {FEATURED_PATIENTS.map((p) => {
              const petFromDb = livePets[p.id] || livePets[p.name.toLowerCase()];
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--radius)',
                    background: 'color-mix(in srgb, var(--card) 75%, transparent)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'border-color 0.15s ease, transform 0.15s ease',
                  }}
                >
                  <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
                    <PetAvatar
                      pet={petFromDb || { id: p.id, name: p.name }}
                      tone={p.speciesTone}
                      species={p.speciesTone as any}
                      iconSize={22}
                      className="t-ava md round"
                    />
                    <div className="col" style={{ gap: '2px', flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                        <b style={{ fontSize: '15px' }}>{p.name}</b>
                        <span
                          className={`sp-chip tone-${p.speciesTone}`}
                          style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            height: '20px',
                            borderRadius: '6px',
                          }}
                        >
                          {p.species}
                        </span>
                      </div>
                      <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.breed}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.45,
                      color: 'var(--foreground)',
                      opacity: 0.88,
                      background: 'color-mix(in srgb, var(--card) 45%, transparent)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid color-mix(in srgb, var(--border) 60%, transparent)',
                    }}
                  >
                    {p.treatment}
                  </div>

                  <div
                    className="row"
                    style={{
                      gap: '8px',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      marginTop: 'auto',
                      paddingTop: '4px',
                    }}
                  >
                    <Stethoscope size={14} className="text-primary" style={{ flexShrink: 0 }} />
                    <span>
                      Лечащий врач: <b style={{ color: 'var(--foreground)' }}>{p.doctorName}</b>
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
