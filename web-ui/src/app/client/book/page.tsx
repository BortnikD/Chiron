'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientApi, clinicApi } from '../../../api';
import {
  Pet,
  Service,
  Veterinarian,
  AvailableSlotResponse,
  Specialization,
  Species,
} from '../../../types';
import { getDoctorDisplay } from '../../../utils/doctorHelpers';
import { AppShell } from '../../../components/layout/AppShell';
import { SpeciesIcon } from '../../../components/ui/SpeciesIcon';
import {
  Calendar,
  CalendarCheck,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Stethoscope,
  CalendarDays,
  CalendarPlus,
  Loader2,
} from 'lucide-react';

const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get('serviceId');
  const initialVetId = searchParams.get('vetId');

  // Шаг мастера (1..5) или завершение
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdApptId, setCreatedApptId] = useState<string | null>(null);

  // Данные с сервера
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);

  // Выбранные сущности
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAnyVet, setIsAnyVet] = useState<boolean>(true);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  // Шаг 4: Выбор слота
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Шаг 5: Комментарий и отправка
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    specializations.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [specializations]);

  const speciesMap = useMemo(() => {
    const map: Record<string, string> = {};
    speciesList.forEach((sp) => {
      map[sp.id] = sp.name;
    });
    return map;
  }, [speciesList]);

  // Загрузка справочников
  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(([petsData, svcData, vetsData, specData, spData]) => {
        const safePets = Array.isArray(petsData) ? petsData : [];
        const safeSvc = Array.isArray(svcData) ? svcData : [];
        const safeVets = Array.isArray(vetsData) ? vetsData : [];
        const safeSpecs = Array.isArray(specData) ? specData : [];
        const safeSp = Array.isArray(spData) ? spData : [];

        setPets(safePets);
        setServices(safeSvc);
        setVeterinarians(safeVets);
        setSpecializations(safeSpecs);
        setSpeciesList(safeSp);

        const activePets = safePets.filter((p) => !p.isArchived);
        if (activePets.length > 0) {
          setSelectedPet(activePets[0]);
        }

        if (initialServiceId) {
          const matchSvc = safeSvc.find((s) => s.id === initialServiceId);
          if (matchSvc) {
            setSelectedService(matchSvc);
            setStep(2);
          }
        }

        if (initialVetId) {
          const matchVet = safeVets.find((v) => v.id === initialVetId);
          if (matchVet) {
            setSelectedVet(matchVet);
            setIsAnyVet(false);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [initialServiceId, initialVetId]);

  // Запрос свободных окон при изменении параметров
  useEffect(() => {
    if (!selectedPet || !selectedService) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(start.getTime() + (horizonDays - 1) * 86400000);
    const toDate = end.toISOString().split('T')[0];

    setLoadingSlots(true);
    setError(null);

    clinicApi
      .findAvailableSlots({
        speciesId: selectedPet.speciesId,
        serviceId: selectedService.id,
        veterinarianId: isAnyVet ? undefined : selectedVet?.id,
        from: fromDate,
        to: toDate,
      })
      .then((slots) => {
        const safeSlots = Array.isArray(slots) ? slots : [];
        safeSlots.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setAvailableSlots(safeSlots);

        // Если текущий выбранный слот больше не валиден, сбрасываем его
        setSelectedSlot((prev) => {
          if (prev && safeSlots.some((s) => s.startAt === prev.startAt)) {
            return prev;
          }
          return null;
        });
      })
      .catch((err) => {
        console.error('Error loading available slots:', err);
        setAvailableSlots([]);
        setSelectedSlot(null);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedPet?.id, selectedService?.id, isAnyVet, selectedVet?.id, fromDate, horizonDays]);

  // Группировка доступных слотов по датам
  const slotsByDay = useMemo(() => {
    const groups: Record<string, AvailableSlotResponse[]> = {};
    availableSlots.forEach((slot) => {
      const d = new Date(slot.startAt);
      const dateKey = d.toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
    });

    return Object.entries(groups).map(([dateLabel, slots]) => {
      const firstSlot = new Date(slots[0].startAt);
      const dow = DAY_NAMES_RU[firstSlot.getDay()];
      const isToday = firstSlot.toISOString().split('T')[0] === todayStr;

      return {
        dateLabel,
        dow,
        note: isToday ? 'сегодня' : `${slots.length} окон`,
        slots,
      };
    });
  }, [availableSlots, todayStr]);

  // Подтверждение и оформление записи
  const handleConfirmBooking = async () => {
    if (!selectedPet || !selectedService || !selectedSlot) {
      setError('Пожалуйста, выберите питомца, услугу и подходящее окно.');
      return;
    }

    // Определяем id врача с проверкой доступности
    let targetVetId: string | undefined;
    if (!isAnyVet && selectedVet) {
      if (selectedSlot.veterinarianIds.includes(selectedVet.id)) {
        targetVetId = selectedVet.id;
      } else {
        setError('Выбранный врач недоступен на это время. Пожалуйста, вернитесь на шаг назад и выберите другое свободное окно.');
        return;
      }
    } else {
      targetVetId = selectedSlot.veterinarianIds[0];
    }

    if (!targetVetId) {
      setError('Не удалось определить ветеринарного врача для этого слота.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await clientApi.bookAppointment({
        petId: selectedPet.id,
        serviceId: selectedService.id,
        veterinarianId: targetVetId,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        clientComment: comment.trim() || null,
      });

      setIsSuccess(true);
      setCreatedApptId(res?.id || null);
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || '';
      if (msg.includes('SUNDAY') || msg.includes('does not work')) {
        setError('Врач не ведёт приём в этот день недели.');
      } else if (msg.includes('overlaps')) {
        setError('Выбранное время уже занято другим клиентом. Пожалуйста, вернитесь на шаг 4 и выберите другое свободное окно.');
      } else if (msg.includes('outside working hours')) {
        setError('Выбранное время выходит за рамки рабочего графика врача.');
      } else if (msg.includes('absent')) {
        setError('Врач отсутствует в этот день (отпуск или больничный).');
      } else {
        setError(msg || 'Не удалось оформить запись. Попробуйте выбрать другое время.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentDoctorDisplay = !isAnyVet && selectedVet
    ? getDoctorDisplay(selectedVet, specsMap).name
    : selectedSlot && selectedSlot.veterinarianIds.length > 0
    ? veterinarians.find((v) => v.id === selectedSlot.veterinarianIds[0])?.userId
      ? getDoctorDisplay(veterinarians.find((v) => v.id === selectedSlot.veterinarianIds[0])!, specsMap).name
      : 'Дежурный врач'
    : 'Любой врач';

  const formatSlotTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  };

  const stepsList = [
    { n: 1, label: 'Кого' },
    { n: 2, label: 'Услуга' },
    { n: 3, label: 'Врач' },
    { n: 4, label: 'Время' },
    { n: 5, label: 'Готово' },
  ];

  return (
    <AppShell title="Запись на приём" currentSection="Запись">
      <div className="content-row">
        {/* Левая колонка: Мастер записи */}
        <section className="island grow">
          <div className="island-head">
            <span className="island-title">
              <CalendarPlus className="ic" />
              Запись на приём
            </span>
            <div className="stepper">
              {stepsList.map((st) => (
                <span key={st.n} className={`step ${step === st.n ? 'on' : step > st.n ? 'done' : ''}`}>
                  <span className="step-n">{st.n}</span>
                  {st.label}
                </span>
              ))}
            </div>
          </div>

          <div className="sep" />

          <div className="island-body" style={{ paddingTop: '16px' }}>
            {/* Экран успеха: Вы записаны */}
            {isSuccess ? (
              <div className="empty" style={{ padding: '40px 16px' }}>
                <div
                  className="empty-art"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
                >
                  <CalendarCheck className="ic ic-40" />
                </div>
                <span className="empty-title">Вы записаны</span>
                <span>
                  Питомец: <b>{selectedPet?.name}</b> · {selectedService?.name}
                </span>
                <span className="badge st badge-PENDING">Ожидает подтверждения</span>
                <div className="row" style={{ gap: '8px', marginTop: '14px' }}>
                  <Link href="/client/appointments" className="btn btn-outline" style={{ textDecoration: 'none' }}>
                    Открыть записи
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsSuccess(false);
                      setStep(1);
                      setSelectedSlot(null);
                      setComment('');
                    }}
                  >
                    Новая запись
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Ошибка валидации бэкенда */}
                {error && (
                  <div className="alert alert-destructive mb-3" role="alert">
                    <AlertCircle className="ic" />
                    <div>
                      <b>Ошибка оформления записи:</b> {error}
                    </div>
                  </div>
                )}

                {/* ШАГ 1: ВЫБОР ПИТОМЦА */}
                {step === 1 && (
                  <div className="col" style={{ gap: '12px' }}>
                    <span className="h2">Кого записываем?</span>
                    <div className="cards">
                      {pets.map((p) => {
                        const isSel = selectedPet?.id === p.id;
                        const spName = speciesMap[p.speciesId] || 'Питомец';
                        const spTone =
                          spName.toLowerCase().includes('соб') || spName.toLowerCase().includes('dog')
                            ? 'dog'
                            : spName.toLowerCase().includes('крол')
                            ? 'rab'
                            : spName.toLowerCase().includes('попуг') || spName.toLowerCase().includes('птиц')
                            ? 'par'
                            : 'cat';

                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={p.isArchived}
                            className={`tcard tone-${spTone} ${isSel ? 'sel' : ''}`}
                            onClick={() => setSelectedPet(p)}
                            style={{ textAlign: 'left', cursor: p.isArchived ? 'not-allowed' : 'pointer', opacity: p.isArchived ? 0.6 : 1 }}
                          >
                            <div className="tcard-head">
                              <span className="t-ava lg">
                                <SpeciesIcon species={spTone} size={24} />
                              </span>
                              <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                                <span className="tcard-title">{p.name}</span>
                                <span className="cell-sub">{spName}</span>
                              </span>
                              {p.isArchived && <span className="badge">Архив</span>}
                              {isSel && (
                                <span className="tcard-check">
                                  <Check className="ic" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ШАГ 2: ВЫБОР УСЛУГИ */}
                {step === 2 && (
                  <div className="col" style={{ gap: '12px' }}>
                    <div className="row between wrap">
                      <span className="h2">
                        Услуга для вида «{selectedPet ? speciesMap[selectedPet.speciesId] || 'Питомец' : ''}»
                      </span>
                      <span className="small muted">Цена и длительность — для этого вида</span>
                    </div>

                    <div className="cards">
                      {services.map((svc) => {
                        const isSel = selectedService?.id === svc.id;
                        const tone = SPEC_TONES[svc.specializationId] || 'ther';
                        const specName = specsMap[svc.specializationId] || 'Терапия';
                        const duration = svc.baseDurationMin || svc.durationMin || 30;

                        return (
                          <button
                            key={svc.id}
                            type="button"
                            className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                            onClick={() => setSelectedService(svc)}
                            style={{ textAlign: 'left', cursor: 'pointer' }}
                          >
                            <div className="row between" style={{ gap: '8px' }}>
                              <span className="t-badge">{specName}</span>
                              {isSel && (
                                <span className="tcard-check">
                                  <Check className="ic" />
                                </span>
                              )}
                            </div>
                            <span className="tcard-title">{svc.name}</span>
                            <div className="tcard-foot">
                              <span className="tcard-meta">
                                <Clock className="ic" />
                                {duration} мин
                              </span>
                              <span className="tcard-price">
                                {svc.basePrice?.toLocaleString('ru-RU')} ₽
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ШАГ 3: ВЫБОР ВРАЧА */}
                {step === 3 && (
                  <div className="col" style={{ gap: '12px' }}>
                    <span className="h2">Врач</span>
                    <div className="cards">
                      {/* Карточка «Любой врач» */}
                      <button
                        type="button"
                        className={`tcard tone-ther ${isAnyVet ? 'sel' : ''}`}
                        onClick={() => {
                          setIsAnyVet(true);
                          setSelectedVet(null);
                          setSelectedSlot(null);
                        }}
                        style={{ textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div className="tcard-head">
                          <span className="t-ava lg round">
                            <Stethoscope className="ic ic-20" />
                          </span>
                          <span className="col grow" style={{ gap: '1px', minWidth: 0 }}>
                            <span className="tcard-title">Любой врач</span>
                            <span className="cell-sub">Покажем все свободные окна</span>
                          </span>
                          {isAnyVet && (
                            <span className="tcard-check">
                              <Check className="ic" />
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Карточки конкретных врачей */}
                      {veterinarians.map((v) => {
                        const isSel = !isAnyVet && selectedVet?.id === v.id;
                        const tone = SPEC_TONES[v.specializationId] || 'ther';
                        const { name, initials, specName } = getDoctorDisplay(v, specsMap);

                        return (
                          <button
                            key={v.id}
                            type="button"
                            className={`tcard tone-${tone} ${isSel ? 'sel' : ''}`}
                            onClick={() => {
                              setIsAnyVet(false);
                              setSelectedVet(v);
                              setSelectedSlot(null);
                            }}
                            style={{ textAlign: 'left', cursor: 'pointer' }}
                          >
                            <div className="tcard-head">
                              <span className="t-ava lg round">{initials}</span>
                              <span className="col grow" style={{ gap: '3px', minWidth: 0 }}>
                                <span className="tcard-title">{name}</span>
                                <span className="row" style={{ gap: '6px' }}>
                                  <span className="t-badge">{specName}</span>
                                  <span className="cell-sub">стаж {v.experienceYears} лет</span>
                                </span>
                              </span>
                              {isSel && (
                                <span className="tcard-check">
                                  <Check className="ic" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ШАГ 4: ВЫБОР ДАТЫ И ВРЕМЕНИ */}
                {step === 4 && (
                  <div className="col" style={{ gap: '12px' }}>
                    <div className="row wrap" style={{ gap: '12px', alignItems: 'flex-end' }}>
                      <div className="field" style={{ width: '180px' }}>
                        <label className="field-label" htmlFor="wz-from">
                          С даты
                        </label>
                        <input
                          id="wz-from"
                          type="date"
                          className="input"
                          value={fromDate}
                          min={todayStr}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <span className="field-label">Период</span>
                        <div className="seg">
                          <button
                            type="button"
                            className={`seg-item ${horizonDays === 7 ? 'on' : ''}`}
                            onClick={() => setHorizonDays(7)}
                          >
                            7 дней
                          </button>
                          <button
                            type="button"
                            className={`seg-item ${horizonDays === 14 ? 'on' : ''}`}
                            onClick={() => setHorizonDays(14)}
                          >
                            14 дней
                          </button>
                        </div>
                      </div>
                      <span className="small muted" style={{ paddingBottom: '8px' }}>
                        Шаг 15 мин · окно {selectedService ? (selectedService.baseDurationMin || 30) + (selectedService.bufferAfterMin || 10) : 40} мин
                      </span>
                    </div>

                    {loadingSlots ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
                        <span>Поиск свободных окон...</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="empty">
                        <div className="empty-art">
                          <Clock className="ic ic-40" />
                        </div>
                        <span className="empty-title">Нет свободных окон</span>
                        <span>Попробуйте выбрать другой период или врача</span>
                      </div>
                    ) : (
                      slotsByDay.map((group) => (
                        <div
                          key={group.dateLabel}
                          className="col"
                          style={{ gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}
                        >
                          <div className="row between">
                            <span className="cell-main">
                              {group.dow}, {group.dateLabel}
                            </span>
                            <span className="cell-sub">{group.note}</span>
                          </div>
                          <div className="chips">
                            {group.slots.map((slot) => {
                              const isSel = selectedSlot?.startAt === slot.startAt;
                              const timeStr = formatSlotTime(slot.startAt);

                              return (
                                <button
                                  key={slot.startAt}
                                  type="button"
                                  className={`slot ${isSel ? 'on sel' : ''}`}
                                  aria-pressed={isSel}
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ШАГ 5: ПОДТВЕРЖДЕНИЕ */}
                {step === 5 && (
                  <div className="col" style={{ gap: '14px', maxWidth: '640px' }}>
                    <span className="h2">Подтверждение записи</span>
                    <dl className="kv" style={{ margin: 0 }}>
                      <dt>Питомец</dt>
                      <dd>
                        {selectedPet?.name} · {selectedPet ? speciesMap[selectedPet.speciesId] : ''}
                      </dd>
                      <dt>Услуга</dt>
                      <dd>{selectedService?.name}</dd>
                      <dt>Врач</dt>
                      <dd>{currentDoctorDisplay}</dd>
                      <dt>Дата и время</dt>
                      <dd className="tnum">
                        {selectedSlot
                          ? `${new Date(selectedSlot.startAt).toLocaleDateString('ru-RU')} в ${formatSlotTime(selectedSlot.startAt)}`
                          : ''}
                      </dd>
                      <dt>Стоимость</dt>
                      <dd className="cell-main tnum">
                        {selectedService?.basePrice?.toLocaleString('ru-RU')} ₽
                      </dd>
                    </dl>

                    <div className="field">
                      <label className="field-label" htmlFor="wz-comment">
                        Комментарий для врача (необязательно)
                      </label>
                      <textarea
                        id="wz-comment"
                        className="textarea"
                        maxLength={1000}
                        rows={3}
                        placeholder="Что беспокоит, тревожные симптомы или особенности питомца"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <span className="field-hint">{comment.length} / 1000 символов</span>
                    </div>

                    <div className="alert alert-info">
                      <AlertCircle className="ic" />
                      <div>
                        Запись создаётся со статусом «Ожидает подтверждения». Точную стоимость рассчитает клиника на приёме.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Подвал мастера: кнопки Назад / Далее / Записаться */}
          {!isSuccess && (
            <div className="island-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  if (step > 1) setStep(step - 1);
                  else router.push('/client/dashboard');
                }}
              >
                <ChevronLeft className="ic" />
                <span>{step === 1 ? 'Отмена' : 'Назад'}</span>
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    (step === 1 && !selectedPet) ||
                    (step === 2 && !selectedService) ||
                    (step === 3 && !isAnyVet && !selectedVet) ||
                    (step === 4 && !selectedSlot)
                  }
                  onClick={() => setStep(step + 1)}
                >
                  <span>Далее</span>
                  <ChevronRight className="ic" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting || !selectedSlot}
                  onClick={handleConfirmBooking}
                >
                  {submitting ? (
                    <span>Оформление...</span>
                  ) : (
                    <>
                      <Check className="ic" />
                      <span>Записаться</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Правый остров: Сводка записи (всегда виден) */}
        <section
          className="island"
          style={{ width: '320px', flex: 'none' }}
          aria-label="Сводка записи"
        >
          <div className="island-head">
            <span className="island-title">Сводка</span>
          </div>
          <div className="island-body">
            <div className="col" style={{ gap: '14px' }}>
              <div className="col" style={{ gap: '2px' }}>
                <span className="small muted">Питомец</span>
                <span className="cell-main">
                  {selectedPet ? `${selectedPet.name} · ${speciesMap[selectedPet.speciesId] || ''}` : '—'}
                </span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="small muted">Услуга</span>
                <span className="cell-main">{selectedService?.name || '—'}</span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="small muted">Врач</span>
                <span className="cell-main">{currentDoctorDisplay}</span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="small muted">Дата и время</span>
                <span className="cell-main">
                  {selectedSlot
                    ? `${new Date(selectedSlot.startAt).toLocaleDateString('ru-RU')} в ${formatSlotTime(selectedSlot.startAt)}`
                    : '—'}
                </span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="small muted">Стоимость</span>
                <span className="cell-main" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {selectedService ? `${selectedService.basePrice?.toLocaleString('ru-RU')} ₽` : '—'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка мастера записи...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}
