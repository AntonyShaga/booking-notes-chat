import en from "./en.json";
import ru from "./ru.json";

const messagesMap = {
  en: en,
  ru: ru,
  // Добавьте другие языки по мере необходимости
};
type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? `${K}` | `${K}.${DeepKeys<T[K]>}` : never;
    }[keyof T]
  : "";

type MessageKey = DeepKeys<typeof en>;

export const getTranslation = (
  lang: keyof typeof messagesMap, // "en" | "ru"
  key: MessageKey // Например, "login.invalidCredentials"
  // Если нужны переменные в сообщениях, например "Hello, {{name}}!"
  // variables?: Record<string, string | number>
): string => {
  const langMessages = messagesMap[lang] || messagesMap["en"]; // Fallback к английскому

  // Функция для безопасного доступа к вложенным свойствам объекта по строке-пути
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const message = getNestedValue(langMessages, key);

  // Если сообщение найдено, и если есть переменные, подставить их
  // if (message && variables) {
  //   // Простая подстановка: {{key}} -> value
  //   let translatedMessage = message;
  //   for (const varKey in variables) {
  //     translatedMessage = translatedMessage.replace(new RegExp(`\\{\\{${varKey}\\}\\}`, 'g'), String(variables[varKey]));
  //   }
  //   return translatedMessage;
  // }

  return message || `Error: Message '${key}' not found for language '${lang}'.`;
};
