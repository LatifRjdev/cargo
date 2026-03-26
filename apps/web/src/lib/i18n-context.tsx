'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
// i18n translations
const ru = {
  common: {
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    search: 'Поиск',
    back: 'Назад',
    next: 'Далее',
    confirm: 'Подтвердить',
    close: 'Закрыть',
  },
  auth: {
    login: 'Войти',
    register: 'Регистрация',
    phone: 'Номер телефона',
    otp: 'Код подтверждения',
    enterOtp: 'Введите код подтверждения',
    sendOtp: 'Отправить код',
    logout: 'Выйти',
  },
  parcels: {
    title: 'Посылки',
    received: 'Получена',
    stored: 'На складе',
    inBox: 'В коробке',
    rejected: 'Отклонена',
    waiting: 'Ожидание',
    weight: 'Вес',
    dimensions: 'Размеры',
    marketplace: 'Маркетплейс',
    category: 'Категория',
    fragile: 'Хрупкое',
    damaged: 'Повреждено',
    description: 'Описание',
    photos: 'Фотографии',
    addTracking: 'Добавить трек-номер',
  },
  boxes: {
    title: 'Коробки',
    buildBox: 'Собрать коробку',
    selectParcels: 'Выбрать посылки',
    estimatedPrice: 'Примерная стоимость',
    customerNote: 'Заметка клиента',
    pack: 'Упаковать',
    cancel: 'Отменить',
    requested: 'Заявка',
    packing: 'Упаковка',
    packed: 'Упакована',
    inTransit: 'В пути',
    customs: 'Таможня',
    arrived: 'Прибыла',
    ready: 'Готова к выдаче',
    delivered: 'Доставлена',
  },
  warehouse: {
    intake: 'Приёмка',
    scan: 'Сканировать',
    unidentified: 'Неопознанные',
    assign: 'Назначить',
    reject: 'Отклонить',
    packingQueue: 'Очередь упаковки',
    cells: 'Ячейки',
  },
  notifications: {
    parcelReceived: 'Ваша посылка получена на складе',
    parcelDamaged: 'Ваша посылка повреждена',
    parcelRejected: 'Ваша посылка отклонена',
    boxPacked: 'Ваша коробка упакована',
    boxShipped: 'Ваша коробка отправлена',
    boxArrived: 'Ваша коробка прибыла',
    boxReady: 'Ваша коробка готова к выдаче',
    boxDelivered: 'Ваша коробка доставлена',
  },
};

const tg = {
  common: {
    loading: 'Боркунӣ...',
    save: 'Нигоҳ доштан',
    cancel: 'Бекор кардан',
    delete: 'Нест кардан',
    search: 'Ҷустуҷӯ',
    back: 'Бозгашт',
    next: 'Навбатӣ',
    confirm: 'Тасдиқ кардан',
    close: 'Пӯшидан',
  },
  auth: {
    login: 'Даромадан',
    register: 'Бақайдгирӣ',
    phone: 'Рақами телефон',
    otp: 'Рамзи тасдиқ',
    enterOtp: 'Рамзи тасдиқро ворид кунед',
    sendOtp: 'Фиристодани рамз',
    logout: 'Баромадан',
  },
  parcels: {
    title: 'Борҳо',
    received: 'Қабул шуд',
    stored: 'Дар анбор',
    inBox: 'Дар қуттӣ',
    rejected: 'Рад шуд',
    waiting: 'Интизорӣ',
    weight: 'Вазн',
    dimensions: 'Андоза',
    marketplace: 'Маркетплейс',
    category: 'Категория',
    fragile: 'Шикастанӣ',
    damaged: 'Осебдида',
    description: 'Тавсиф',
    photos: 'Аксҳо',
    addTracking: 'Илова кардани рақами пайгирӣ',
  },
  boxes: {
    title: 'Қуттиҳо',
    buildBox: 'Ҷамъ кардани қуттӣ',
    selectParcels: 'Интихоби борҳо',
    estimatedPrice: 'Нархи тахминӣ',
    customerNote: 'Ёддошти муштарӣ',
    pack: 'Басташ кардан',
    cancel: 'Бекор кардан',
    requested: 'Дархост',
    packing: 'Басташ',
    packed: 'Басташ шуд',
    inTransit: 'Дар роҳ',
    customs: 'Гумрук',
    arrived: 'Расид',
    ready: 'Барои гирифтан омода',
    delivered: 'Расонида шуд',
  },
  warehouse: {
    intake: 'Қабул',
    scan: 'Скан кардан',
    unidentified: 'Номаълум',
    assign: 'Таъйин кардан',
    reject: 'Рад кардан',
    packingQueue: 'Навбати басташ',
    cells: 'Ҳуҷраҳо',
  },
  notifications: {
    parcelReceived: 'Бори шумо дар анбор қабул шуд',
    parcelDamaged: 'Бори шумо осеб дидааст',
    parcelRejected: 'Бори шумо рад шуд',
    boxPacked: 'Қуттии шумо басташ шуд',
    boxShipped: 'Қуттии шумо фиристода шуд',
    boxArrived: 'Қуттии шумо расид',
    boxReady: 'Қуттии шумо барои гирифтан омода аст',
    boxDelivered: 'Қуттии шумо расонида шуд',
  },
};

type Locale = 'ru' | 'tg';
type Translations = typeof ru;

const translations: Record<Locale, Translations> = { ru, tg };

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ru',
  t: ru,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('locale') as Locale) || 'ru';
    }
    return 'ru';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
