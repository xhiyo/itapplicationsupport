const fs = require('fs');

const data = {
  Indonesia: {
    "Kembali ke daftar ticket": "Kembali ke daftar tiket",
    "Informasi Ticket": "Informasi Tiket",
    "Deskripsi": "Deskripsi",
    "Lampiran": "Lampiran",
    "Tidak ada lampiran disertakan.": "Tidak ada lampiran disertakan."
  },
  Inggris: {
    "Kembali ke daftar ticket": "Back to ticket list",
    "Informasi Ticket": "Ticket Information",
    "Deskripsi": "Description",
    "Lampiran": "Attachments",
    "Tidak ada lampiran disertakan.": "No attachments included."
  },
  Arab: {
    "Kembali ke daftar ticket": "العودة إلى قائمة التذاكر",
    "Informasi Ticket": "معلومات التذكرة",
    "Deskripsi": "الوصف",
    "Lampiran": "المرفقات",
    "Tidak ada lampiran disertakan.": "لم يتم تضمين مرفقات."
  },
  Cina: {
    "Kembali ke daftar ticket": "返回工单列表",
    "Informasi Ticket": "工单信息",
    "Deskripsi": "描述",
    "Lampiran": "附件",
    "Tidak ada lampiran disertakan.": "未包含附件。"
  },
  Jerman: {
    "Kembali ke daftar ticket": "Zurück zur Ticketliste",
    "Informasi Ticket": "Ticketinformationen",
    "Deskripsi": "Beschreibung",
    "Lampiran": "Anhänge",
    "Tidak ada lampiran disertakan.": "Keine Anhänge beigefügt."
  },
  Perancis: {
    "Kembali ke daftar ticket": "Retour à la liste des billets",
    "Informasi Ticket": "Informations sur le billet",
    "Deskripsi": "Description",
    "Lampiran": "Pièces jointes",
    "Tidak ada lampiran disertakan.": "Aucune pièce jointe incluse."
  },
  Jawa: {
    "Kembali ke daftar ticket": "Mbalik menyang daftar tiket",
    "Informasi Ticket": "Informasi Tiket",
    "Deskripsi": "Katrangan",
    "Lampiran": "Lampiran",
    "Tidak ada lampiran disertakan.": "Ora ana lampiran."
  }
};

const fsTranslations = fs.readFileSync('src/utils/translations.js', 'utf-8');
const obj = eval('(' + fsTranslations.replace('export const translations =', '') + ')');

for (const lang in data) {
    if (obj[lang]) {
        obj[lang] = { ...obj[lang], ...data[lang] };
    }
}

const content = 'export const translations = ' + JSON.stringify(obj, null, 2) + ';';
fs.writeFileSync('src/utils/translations.js', content, 'utf-8');
console.log('Translations updated for ticket details!');
