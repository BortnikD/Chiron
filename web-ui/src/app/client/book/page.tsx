'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi, clinicApi } from '../../../api';
import {
  Pet,
  Service,
  Veterinarian,
  WorkSchedule,
  DayOfWeek,
  AvailableSlotResponse,
  Specialization,
} from '../../../types';
import { getDoctorDisplay } from '../../../utils/doctorHelpers';
import { AppShell } from '../../../components/layout/AppShell';
import {
  Calendar,
  Clock,
  User,
  PawPrint,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Loader2,
} from 'lucide-react';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Понедельник',
  TUESDAY: 'Вторник',
  WEDNESDAY: 'Среда',
  THURSDAY: 'Четверг',
  FRIDAY: 'Пятница',
  SATURDAY: 'Суббота',
  SUNDAY: 'Воскресенье',
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
};

export default function BookAppointmentPage() {
  const router = useRouter();

  // Шаги: 1: Питомец, 2: Услуга, 3: Врач, 4: Дата и время, 5: Подтверждение
  const [step, setStep] = useState(1);

  // Справочные данные
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Выбранные параметры приёма
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  // Начальная дата — следующий день
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(tomorrow);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotResponse[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientComment, setClientComment] = useState<string>('');

  // Состояние отправки записи
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    specializations.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [specializations]);

  useEffect(() => {
    Promise.all([
      clientApi.getPets(),
      clinicApi.getServices(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
    ])
      .then(([petsData, svcData, vetsData, specData]) => {
        const safePets = Array.isArray(petsData) ? petsData : [];
        const safeServices = Array.isArray(svcData) ? svcData : [];
        const safeVets = Array.isArray(vetsData) ? vetsData : [];
        const safeSpecs = Array.isArray(specData) ? specData : [];

        setPets(safePets);
        setServices(safeServices);
        setVeterinarians(safeVets);
        setSpecializations(safeSpecs);

        if (safePets.length > 0) setSelectedPet(safePets[0]);
        if (safeServices.length > 0) setSelectedService(safeServices[0]);
        if (safeVets.length > 0) setSelectedVet(safeVets[0]);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Загрузка расписания работы врача при его выборе
  useEffect(() => {
    if (selectedVet) {
      clinicApi
        .getWorkSchedules(selectedVet.id)
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setVetSchedules(list);

          // Если текущая выбранная дата — выходной врача, выбираем ближайший рабочий день
          if (list.length > 0) {
            const curDayIdx = new Date(selectedDate + 'T00:00:00').getDay();
            const curDow = DAYS_OF_WEEK[curDayIdx];
            if (!list.some((s) => s.dayOfWeek === curDow)) {
              for (let i = 1; i <= 7; i++) {
                const nextDate = new Date(Date.now() + i * 86400000);
                const nextDow = DAYS_OF_WEEK[nextDate.getDay()];
                if (list.some((s) => s.dayOfWeek === nextDow)) {
                  setSelectedDate(nextDate.toISOString().split('T')[0]);
                  break;
                }
              }
            }
          }
        })
        .catch(() => setVetSchedules([]));
    }
  }, [selectedVet?.id]);

  // Проверка рабочего дня врача по выбранной дате
  const selectedDayIndex = new Date(selectedDate + 'T00:00:00').getDay();
  const selectedDayOfWeek = DAYS_OF_WEEK[selectedDayIndex];
  const currentDaySchedule = vetSchedules.find((s) => s.dayOfWeek === selectedDayOfWeek);
  const isDoctorOff = vetSchedules.length > 0 && !currentDaySchedule;

  // Переход к ближайшему рабочему дню врача
  const pickNearestDayOfWeek = (dow: DayOfWeek) => {
    const targetDayIdx = DAYS_OF_WEEK.indexOf(dow);
    for (let i = 0; i <= 14; i++) {
      const candidate = new Date(Date.now() + i * 86400000);
      if (candidate.getDay() === targetDayIdx) {
        setSelectedDate(candidate.toISOString().split('T')[0]);
        break;
      }
    }
  };

  // Запрос реальных свободных слотов с бэкенда
  useEffect(() => {
    if (!selectedPet || !selectedService || !selectedVet || !selectedDate || isDoctorOff) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);

    clinicApi
      .findAvailableSlots({
        speciesId: selectedPet.speciesId,
        serviceId: selectedService.id,
        veterinarianId: selectedVet.id,
        from: selectedDate,
        to: selectedDate,
      })
      .then((res) => {
        if (!isMounted) return;
        const slots = Array.isArray(res) ? res : [];
        // Сортировка слотов по времени начала
        slots.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
        setAvailableSlots(slots);

        setSelectedSlot((prev) => {
          if (prev && slots.some((s) => s.startAt === prev.startAt)) {
            return prev;
          }
          return slots.length > 0 ? slots[0] : null;
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching available slots:', err);
        setAvailableSlots([]);
        setSelectedSlot(null);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPet?.id, selectedPet?.speciesId, selectedService?.id, selectedVet?.id, selectedDate, isDoctorOff]);

  const formatSlotTime = (isoString: string) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    }).format(new Date(isoString));
  };

  const getSlotHourMoscow = (isoString: string) => {
    const str = new Intl.DateTimeFormat('ru-RU', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/Moscow',
    }).format(new Date(isoString));
    return parseInt(str, 10);
  };

  const morningSlots = availableSlots.filter((s) => getSlotHourMoscow(s.startAt) < 12);
  const afternoonSlots = availableSlots.filter((s) => getSlotHourMoscow(s.startAt) >= 12);

  const handleConfirmBooking = async () => {
    if (!selectedPet || !selectedService || !selectedVet || !selectedSlot) {
      setError('Пожалуйста, выберите доступное окно для записи.');
      return;
    }
    if (isDoctorOff) {
      const doc = getDoctorDisplay(selectedVet, specsMap);
      setError(`Врач ${doc.name} не ведёт приём в этот день (${DAY_LABELS[selectedDayOfWeek]}).`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await clientApi.bookAppointment({
        petId: selectedPet.id,
        serviceId: selectedService.id,
        veterinarianId: selectedVet.id,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        clientComment: clientComment.trim() || null,
      });

      router.push('/client/appointments');
    } catch (err: any) {
      setError(err?.message || 'Не удалось записаться на выбранное время.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Питомец' },
    { num: 2, label: 'Услуга' },
    { num: 3, label: 'Врач' },
    { num: 4, label: 'Дата и время' },
    { num: 5, label: 'Подтверждение' },
  ];

  const currentDoctorDisplay = getDoctorDisplay(selectedVet, specsMap);

  return (
    <AppShell
      title="Онлайн-запись на приём"
      subtitle="Выберите питомца, услугу, специалиста и удобное окно"
    >
      <div className="flex flex-col gap-2 p-1 max-w-4xl mx-auto w-full">
        {/* Шаги мастера записи */}
        <section className="island p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
            {stepsList.map((s) => {
              const isPast = step > s.num;
              const isCur = step === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 text-xs shrink-0 ${
                    isCur
                      ? 'font-bold text-[var(--foreground)]'
                      : isPast
                      ? 'text-[var(--primary-text)] font-medium cursor-pointer'
                      : 'text-[var(--muted-foreground)] opacity-60'
                  }`}
                  onClick={() => {
                    if (isPast) setStep(s.num);
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 transition-colors ${
                      isCur
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : isPast
                        ? 'bg-[var(--primary)]/20 text-[var(--primary-text)]'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                  {s.num < 5 && <ChevronRight className="w-3 h-3 text-[var(--muted-foreground)] ml-1" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* Карточка текущего шага */}
        <section className="island p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* ШАГ 1: ВЫБОР ПИТОМЦА */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Шаг 1: Выберите питомца</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Укажите, для кого планируется приём
                  </p>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
                    <span>Загрузка питомцев...</span>
                  </div>
                ) : pets.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center gap-3">
                    <PawPrint className="w-8 h-8 text-[var(--muted-foreground)]" />
                    <div className="text-xs text-[var(--muted-foreground)]">
                      У вас ещё нет зарегистрированных питомцев
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/client/pets')}
                      className="btn btn-primary h-8 px-4 text-xs"
                    >
                      Добавить питомца
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {pets.map((pet) => {
                      const isSel = selectedPet?.id === pet.id;
                      return (
                        <div
                          key={pet.id}
                          onClick={() => setSelectedPet(pet)}
                          className={`card clickable p-4 flex items-center gap-3 transition-all ${
                            isSel
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                              : 'hover:border-[var(--border)] bg-[var(--card)]'
                          }`}
                        >
                          <span
                            className={`avatar w-10 h-10 text-xs font-bold shrink-0 ${
                              isSel
                                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                                : 'bg-[var(--muted)] text-[var(--foreground)]'
                            }`}
                          >
                            {pet.name.charAt(0)}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate">{pet.name}</span>
                            <span className="text-xs text-[var(--muted-foreground)] truncate">
                              {pet.species?.name || 'Питомец'} {pet.breed ? `· ${pet.breed}` : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ШАГ 2: ВЫБОР УСЛУГИ */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Шаг 2: Выберите услугу</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Выберите категорию или процедуру для питомца ({selectedPet?.name})
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((svc) => {
                    const isSel = selectedService?.id === svc.id;
                    const duration = svc.baseDurationMin ?? svc.durationMin ?? 30;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`card clickable p-4 flex flex-col justify-between gap-3 transition-all ${
                          isSel
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                            : 'hover:border-[var(--border)] bg-[var(--card)]'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-sm leading-snug">{svc.name}</span>
                            <span className="font-mono text-xs font-bold shrink-0 text-[var(--primary-text)]">
                              {svc.basePrice?.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                              {svc.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3" />
                            {duration} минут
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ШАГ 3: ВЫБОР ВРАЧА */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Шаг 3: Выберите ветеринарного врача</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Специалисты клиники Chiron
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {veterinarians.map((vet) => {
                    const isSel = selectedVet?.id === vet.id;
                    const doc = getDoctorDisplay(vet, specsMap);

                    return (
                      <div
                        key={vet.id}
                        onClick={() => setSelectedVet(vet)}
                        className={`card clickable p-4 flex items-center gap-3 transition-all ${
                          isSel
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                            : 'hover:border-[var(--border)] bg-[var(--card)]'
                        }`}
                      >
                        <span
                          className={`avatar w-11 h-11 text-xs font-bold shrink-0 ${
                            isSel
                              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                              : 'bg-[var(--muted)] text-[var(--foreground)]'
                          }`}
                        >
                          {doc.initials}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate" title={doc.name}>{doc.name}</span>
                          <span className="text-xs text-[var(--muted-foreground)] truncate" title={doc.title}>
                            {doc.title} · стаж {vet.experienceYears} лет
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ШАГ 4: ДАТА И ВРЕМЯ */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Шаг 4: Выберите дату и время приёма</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Врач: <strong>{currentDoctorDisplay.name}</strong> ({currentDoctorDisplay.title}) · Услуга: {selectedService?.name}
                  </p>
                </div>

                {/* Предупреждение о выходном дне врача */}
                {isDoctorOff && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Врач не принимает в этот день ({DAY_LABELS[selectedDayOfWeek]} — выходной).
                      </span>
                    </div>

                    {vetSchedules.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          Приёмные дни врача:
                        </span>
                        {vetSchedules.map((s) => (
                          <button
                            key={s.dayOfWeek}
                            type="button"
                            onClick={() => pickNearestDayOfWeek(s.dayOfWeek)}
                            className="badge b-completed text-[10px] hover:scale-105 transition-transform cursor-pointer"
                            title={`Перейти на ближайший ${DAY_LABELS[s.dayOfWeek]}`}
                          >
                            {DAY_SHORT[s.dayOfWeek]} {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Выбор даты */}
                  <div className="field">
                    <label className="field-label text-xs">Дата визита</label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input text-xs font-mono"
                    />

                    {/* Быстрый выбор рабочих дней врача */}
                    {vetSchedules.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                          Дни приёма врача:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {vetSchedules.map((s) => (
                            <button
                              key={s.dayOfWeek}
                              type="button"
                              onClick={() => pickNearestDayOfWeek(s.dayOfWeek)}
                              className={`badge text-[10px] cursor-pointer transition-colors ${
                                selectedDayOfWeek === s.dayOfWeek ? 'b-completed font-bold ring-1 ring-[var(--primary)]' : 'hover:border-[var(--primary)]'
                              }`}
                            >
                              {DAY_SHORT[s.dayOfWeek]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Доступные слоты приёма */}
                  <div className="sm:col-span-2 flex flex-col gap-3">
                    {isDoctorOff ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
                        Выберите рабочий день врача в календаре слева, чтобы увидеть доступные слоты.
                      </div>
                    ) : loadingSlots ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-text)]" />
                        <span>Поиск доступных окон для записи...</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center gap-2">
                        <Clock className="w-6 h-6 text-[var(--muted-foreground)] opacity-50" />
                        <span>На выбранную дату ({selectedDate}) нет свободных окон для записи.</span>
                        <span className="text-[11px] opacity-75">Пожалуйста, выберите другую дату в календаре слева.</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-[var(--muted-foreground)] font-medium">
                            Утренние слоты
                          </span>
                          {morningSlots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                              {morningSlots.map((slot) => {
                                const timeStr = formatSlotTime(slot.startAt);
                                const isSel = selectedSlot?.startAt === slot.startAt;
                                return (
                                  <button
                                    key={slot.startAt}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-colors border ${
                                      isSel
                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-bold border-transparent'
                                        : 'bg-[var(--card)] hover:border-[var(--primary)] text-[var(--foreground)] border-[var(--border)]'
                                    }`}
                                  >
                                    {timeStr}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)] italic">
                              Утренних свободных окон нет
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-[var(--muted-foreground)] font-medium">
                            Дневные и вечерние слоты
                          </span>
                          {afternoonSlots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                              {afternoonSlots.map((slot) => {
                                const timeStr = formatSlotTime(slot.startAt);
                                const isSel = selectedSlot?.startAt === slot.startAt;
                                return (
                                  <button
                                    key={slot.startAt}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-colors border ${
                                      isSel
                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-bold border-transparent'
                                        : 'bg-[var(--card)] hover:border-[var(--primary)] text-[var(--foreground)] border-[var(--border)]'
                                    }`}
                                  >
                                    {timeStr}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)] italic">
                              Дневных свободных окон нет
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ШАГ 5: ПОДТВЕРЖДЕНИЕ ЗАПИСИ */}
            {step === 5 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold">Шаг 5: Подтверждение записи</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Проверьте параметры и оставьте пожелания или жалобы для врача
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 flex flex-col gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--muted-foreground)] uppercase block">
                        Питомец
                      </span>
                      <span className="font-bold">{selectedPet?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--muted-foreground)] uppercase block">
                        Услуга
                      </span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--muted-foreground)] uppercase block">
                        Врач
                      </span>
                      <span className="font-bold" title={currentDoctorDisplay.name}>
                        {currentDoctorDisplay.name}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)] block">
                        {currentDoctorDisplay.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--muted-foreground)] uppercase block">
                        Дата и время
                      </span>
                      <span className="font-mono font-bold text-[var(--primary-text)]">
                        {selectedDate} в {selectedSlot ? formatSlotTime(selectedSlot.startAt) : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)]/70 flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">Стоимость приёма:</span>
                    <span className="font-mono text-base font-extrabold text-[var(--foreground)]">
                      {selectedService?.basePrice?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                <div className="field">
                  <label className="field-label text-xs">Комментарий для ветеринара (необязательно)</label>
                  <textarea
                    rows={2}
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    placeholder="Опишите симптомы, тревожные признаки или вопросы..."
                    className="textarea text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Навигация мастера (Назад / Далее) */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn btn-outline h-9 px-4 text-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedPet) ||
                  (step === 2 && !selectedService) ||
                  (step === 3 && !selectedVet) ||
                  (step === 4 && (!selectedSlot || isDoctorOff))
                }
                className="btn btn-primary h-9 px-5 text-xs flex items-center gap-1.5"
              >
                <span>Далее</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting || isDoctorOff || !selectedSlot}
                className="btn btn-primary h-9 px-6 text-xs flex items-center gap-1.5 shadow-md"
              >
                {submitting ? (
                  <span>Оформление...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Подтвердить запись</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
