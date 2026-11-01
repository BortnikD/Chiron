import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Clock, MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Колонка 1: Бренд и описание */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-base font-bold text-slate-900">Chiron</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Современная ветеринарная клиника. Профессиональная забота, высокоточная диагностика и бережное отношение к каждому питомцу.
            </p>
          </div>

          {/* Колонка 2: Навигация */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Навигация
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/services" className="hover:text-emerald-600 transition-colors">
                  Услуги и цены
                </Link>
              </li>
              <li>
                <Link href="/veterinarians" className="hover:text-emerald-600 transition-colors">
                  Наши специалисты
                </Link>
              </li>
              <li>
                <Link href="/client/book" className="hover:text-emerald-600 transition-colors">
                  Онлайн-запись
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Контакты */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Контакты
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+7 (800) 555-35-35</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>info@chiron-vet.ru</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ул. Ветеринарная, д. 12</span>
              </li>
            </ul>
          </div>

          {/* Колонка 4: График работы */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Режим работы
            </h4>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p>Пн — Пт: 08:00 – 21:00</p>
                <p>Сб — Вс: 09:00 – 19:00</p>
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">Стационар круглосуточно</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Chiron Clinic. Все права защищены.</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Лицензированная ветеринарная деятельность</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
