import commonEn from "@/public/locales/en/common.json"
import commonZh from "@/public/locales/zh/common.json"

const translations = {
  en: {
    common: commonEn,
  },
  zh: {
    common: commonZh,
  },
}

export function getTranslation(locale: string, namespace: string, key: string): string {
  const parts = key.split(".")
  let value: any =
    translations[locale as keyof typeof translations]?.[
      namespace as keyof (typeof translations)[keyof typeof translations]
    ]

  for (const part of parts) {
    value = value?.[part]
  }

  return value || key
}

export function useT(locale: string) {
  return (namespace: string, key: string) => getTranslation(locale, namespace, key)
}
