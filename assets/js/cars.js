/*
 * Avtomobillar bazasi (demo).
 * Backend ulanganda bu ro'yxat API'dan keladi (masalan, Frappe: /api/resource/Car Listing).
 *
 * Maydonlar:
 *   status:       "available" (Sotuvda) | "reserved" (Bron) | "sold" (Baraka boʻldi)
 *   body:         "suv" | "sedan" | "pickup" | "liftback"
 *   fuel:         "petrol" | "diesel" | "hybrid" | "electric"
 *   transmission: "automatic" | "manual"
 *   drive:        "awd" | "4wd" | "rwd" | "fwd"
 *   condition:    "clean" (tozza, kraskasiz) | "partial" (qisman kraska)
 *   features:     i18n.js dagi "feat.*" kalitlari
 */
(function () {
  function photos(slug, count) {
    var list = [];
    for (var i = 1; i <= count; i++) list.push("assets/img/cars/" + slug + "-" + i + ".webp");
    return list;
  }
  var IG = "https://www.instagram.com/_inomarka_bor_/";

  window.IB_CARS = [
    {
      id: "chevrolet-traverse-2023",
      brand: "Chevrolet", model: "Traverse", trim: "Premier",
      year: 2023, regYear: 2025, price: 48000, negotiable: true, mileage: 12000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "3.6 V6", power: 310, color: "black", condition: "clean", seats: 7,
      status: "available", featured: true, postedAt: "2026-09-06",
      images: photos("chevrolet-traverse-2023", 4), video: IG,
      description: {
        uz: "Chevrolet Traverse Premier — 7 oʻrinli keng oilaviy krossover. 2023-yilda ishlab chiqarilgan, texpasport 2025-yilda olingan.\nAtigi 12 000 km yurgan — probeg halol, kraska yoʻq (tozza 100%). Salon ideal holatda, hech qanday texnik muammo yoʻq.",
        ru: "Chevrolet Traverse Premier — просторный 7-местный семейный кроссовер. Год выпуска 2023, техпаспорт получен в 2025 году.\nПробег всего 12 000 км — честный, без окрасов (родная краска 100%). Салон в идеальном состоянии, технических проблем нет.",
      },
      features: ["leather", "panorama", "ventSeats", "heatedSeats", "camera360", "adaptiveCruise", "keyless", "powerTailgate", "thirdRow", "carplay", "wirelessCharge", "blindSpot"],
    },
    {
      id: "lexus-lx570-2020",
      brand: "Lexus", model: "LX 570", trim: "Sport",
      year: 2020, regYear: 2020, price: 92000, negotiable: true, mileage: 68000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "5.7 V8", power: 367, color: "white", condition: "clean", seats: 8,
      status: "available", featured: true, postedAt: "2026-10-02",
      images: photos("lexus-lx570-2020", 3), video: IG,
      description: {
        uz: "Lexus LX 570 — ishonchlilik va qulaylik timsoli. 5.7 V8 dvigatel, doimiy toʻliq privod, adaptiv osma.\nOq rang, ichi qora charm salon. Servis ishlari oʻz vaqtida bajarilgan, kraska yoʻq.",
        ru: "Lexus LX 570 — символ надёжности и комфорта. Двигатель 5.7 V8, постоянный полный привод, адаптивная подвеска.\nБелый цвет, чёрный кожаный салон. Обслуживание вовремя, без окрасов.",
      },
      features: ["leather", "sunroof", "ventSeats", "heatedSeats", "camera360", "airSuspension", "premiumAudio", "rearScreens", "softClose", "thirdRow", "offroad"],
    },
    {
      id: "toyota-land-cruiser-300-2022",
      brand: "Toyota", model: "Land Cruiser 300", trim: "VX",
      year: 2022, regYear: 2022, price: 99500, negotiable: false, mileage: 35000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "3.5 V6 twin-turbo", power: 415, color: "white", condition: "clean", seats: 7,
      status: "available", featured: true, postedAt: "2026-09-29",
      images: photos("toyota-land-cruiser-300-2022", 4), video: IG,
      description: {
        uz: "Toyota Land Cruiser 300 — yangi avlod afsonasi. 3.5 V6 twin-turbo, 10 bosqichli avtomat, TNGA-F platforma.\n35 000 km yurgan, tozza. Texnik xizmat tarixi mavjud.",
        ru: "Toyota Land Cruiser 300 — легенда нового поколения. 3.5 V6 twin-turbo, 10-ступенчатый автомат, платформа TNGA-F.\nПробег 35 000 км, без окрасов. Есть история обслуживания.",
      },
      features: ["leather", "sunroof", "ventSeats", "heatedSeats", "camera360", "adaptiveCruise", "laneAssist", "premiumAudio", "keyless", "thirdRow", "offroad", "wirelessCharge"],
    },
    {
      id: "mercedes-s580-2022",
      brand: "Mercedes-Benz", model: "S 580", trim: "4MATIC Long",
      year: 2022, regYear: 2022, price: 128000, negotiable: true, mileage: 28000,
      body: "sedan", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "4.0 V8 biturbo", power: 503, color: "black", condition: "clean", seats: 5,
      status: "available", featured: true, postedAt: "2026-09-25",
      images: photos("mercedes-s580-2022", 3), video: IG,
      description: {
        uz: "Yangi avlod S-Class (W223) — MBUX, orqa qator uchun ekranlar, Burmester 4D audio, massaj va ventilyatsiya.\n28 000 km, tozza. Biznes va oilaviy safarlar uchun eng yuqori daraja.",
        ru: "Новое поколение S-Class (W223) — MBUX, экраны для задних пассажиров, Burmester 4D, массаж и вентиляция.\n28 000 км, без окрасов. Высший уровень для бизнеса и семьи.",
      },
      features: ["leather", "panorama", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "rearScreens", "softClose", "ambient", "matrixLed", "nightVision"],
    },
    {
      id: "range-rover-2023",
      brand: "Land Rover", model: "Range Rover", trim: "P530 First Edition",
      year: 2023, regYear: 2024, price: 165000, negotiable: true, mileage: 18000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "4.4 V8 twin-turbo", power: 530, color: "white", condition: "clean", seats: 5,
      status: "available", featured: true, postedAt: "2026-09-21",
      images: photos("range-rover-2023", 2), video: IG,
      description: {
        uz: "Range Rover (L460) — 4.4 V8, 530 ot kuchi. Meridian Signature audio, Executive Class orqa oʻrindiqlar, toʻliq boshqariladigan orqa gʻildiraklar.\n18 000 km, holati yangidek.",
        ru: "Range Rover (L460) — 4.4 V8, 530 л.с. Аудио Meridian Signature, задние кресла Executive Class, полноуправляемое шасси.\n18 000 км, состояние нового автомобиля.",
      },
      features: ["leather", "panorama", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "rearScreens", "softClose", "matrixLed", "keyless"],
    },
    {
      id: "lexus-lx600-2023",
      brand: "Lexus", model: "LX 600", trim: "Luxury",
      year: 2023, regYear: 2023, price: 135000, negotiable: false, mileage: 15000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "3.5 V6 twin-turbo", power: 415, color: "black", condition: "clean", seats: 7,
      status: "available", featured: true, postedAt: "2026-10-04",
      images: photos("lexus-lx600-2023", 3), video: IG,
      description: {
        uz: "Lexus LX 600 — 3.5 V6 twin-turbo, 415 o.k., Mark Levinson audio, 4 zonali klimat-kontrol.\n15 000 km, tozza, qora rang — eng koʻp soʻraladigan konfiguratsiya.",
        ru: "Lexus LX 600 — 3.5 V6 twin-turbo, 415 л.с., аудио Mark Levinson, 4-зонный климат-контроль.\n15 000 км, без окрасов, чёрный цвет — самая востребованная комплектация.",
      },
      features: ["leather", "sunroof", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "rearScreens", "fridge", "thirdRow", "offroad"],
    },
    {
      id: "chevrolet-tahoe-2022",
      brand: "Chevrolet", model: "Tahoe", trim: "High Country",
      year: 2022, regYear: 2022, price: 72000, negotiable: true, mileage: 41000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "6.2 V8", power: 420, color: "black", condition: "clean", seats: 7,
      status: "available", featured: false, postedAt: "2026-09-18",
      images: photos("chevrolet-tahoe-2022", 3), video: IG,
      description: {
        uz: "Chevrolet Tahoe High Country — 6.2 V8, 10 bosqichli avtomat, pnevmo-osma, 7 oʻrin.\n41 000 km, tozza. Uzoq safarlar va katta oila uchun ideal.",
        ru: "Chevrolet Tahoe High Country — 6.2 V8, 10-ступенчатый автомат, пневмоподвеска, 7 мест.\n41 000 км, без окрасов. Идеален для дальних поездок и большой семьи.",
      },
      features: ["leather", "panorama", "ventSeats", "heatedSeats", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "hud", "thirdRow", "towHitch", "powerTailgate"],
    },
    {
      id: "bmw-x7-2021",
      brand: "BMW", model: "X7", trim: "M50i",
      year: 2021, regYear: 2021, price: 85000, negotiable: true, mileage: 52000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "4.4 V8 biturbo", power: 530, color: "black", condition: "partial", seats: 7,
      status: "available", featured: false, postedAt: "2026-09-14",
      images: photos("bmw-x7-2021", 3), video: IG,
      description: {
        uz: "BMW X7 M50i — 530 o.k., Sky Lounge panorama tom, Bowers & Wilkins audio, massajli oʻrindiqlar.\n52 000 km. Bitta detal (old bamper) kraska qilingan — koʻrish vaqtida koʻrsatamiz.",
        ru: "BMW X7 M50i — 530 л.с., панорама Sky Lounge, аудио Bowers & Wilkins, сиденья с массажем.\n52 000 км. Одна деталь (передний бампер) окрашена — покажем при осмотре.",
      },
      features: ["leather", "panorama", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "softClose", "ambient", "thirdRow"],
    },
    {
      id: "cadillac-escalade-2022",
      brand: "Cadillac", model: "Escalade", trim: "Sport Platinum",
      year: 2022, regYear: 2022, price: 105000, negotiable: true, mileage: 33000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "6.2 V8", power: 420, color: "white", condition: "clean", seats: 7,
      status: "reserved", featured: false, postedAt: "2026-09-10",
      images: photos("cadillac-escalade-2022", 2), video: IG,
      description: {
        uz: "Cadillac Escalade Sport Platinum — 6.2 V8, 38 dyuymli egilgan OLED ekran, AKG Studio Reference audio (36 karnay).\n33 000 km, tozza. Hozirda bron qilingan.",
        ru: "Cadillac Escalade Sport Platinum — 6.2 V8, изогнутый OLED-дисплей 38\", аудио AKG Studio Reference (36 динамиков).\n33 000 км, без окрасов. Сейчас забронирован.",
      },
      features: ["leather", "panorama", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "rearScreens", "nightVision", "thirdRow"],
    },
    {
      id: "porsche-cayenne-2020",
      brand: "Porsche", model: "Cayenne", trim: "Tiptronic S",
      year: 2020, regYear: 2020, price: 72000, negotiable: true, mileage: 47000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "3.0 V6 turbo", power: 340, color: "blue", condition: "clean", seats: 5,
      status: "available", featured: false, postedAt: "2026-09-08",
      images: photos("porsche-cayenne-2020", 3), video: IG,
      description: {
        uz: "Porsche Cayenne (E3) — 3.0 V6 turbo, Sport Chrono paketi, pnevmo-osma, BOSE audio.\n47 000 km, tozza. Haydovchilik zavqi va kundalik qulaylik birga.",
        ru: "Porsche Cayenne (E3) — 3.0 V6 turbo, пакет Sport Chrono, пневмоподвеска, аудио BOSE.\n47 000 км, без окрасов. Драйв и повседневный комфорт в одном.",
      },
      features: ["leather", "panorama", "ventSeats", "heatedSeats", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "keyless", "sportExhaust", "carplay"],
    },
    {
      id: "bmw-m5-competition-2021",
      brand: "BMW", model: "M5", trim: "Competition",
      year: 2021, regYear: 2021, price: 95000, negotiable: true, mileage: 31000,
      body: "sedan", fuel: "petrol", transmission: "automatic", drive: "awd",
      engine: "4.4 V8 biturbo", power: 625, color: "blue", condition: "clean", seats: 5,
      status: "available", featured: false, postedAt: "2026-09-03",
      images: photos("bmw-m5-competition-2021", 2), video: IG,
      description: {
        uz: "BMW M5 Competition (F90 LCI) — 625 o.k., 0–100 km/soat 3.3 soniyada. Karbon paket, M sport chiqindi tizimi.\n31 000 km, tozza. Haqiqiy biznes-raketa.",
        ru: "BMW M5 Competition (F90 LCI) — 625 л.с., 0–100 км/ч за 3.3 с. Карбоновый пакет, спортивный выхлоп M.\n31 000 км, без окрасов. Настоящая бизнес-ракета.",
      },
      features: ["leather", "sunroof", "ventSeats", "heatedSeats", "hud", "camera360", "adaptiveCruise", "premiumAudio", "carbon", "sportExhaust", "softClose", "ambient"],
    },
    {
      id: "mercedes-gls-2021",
      brand: "Mercedes-Benz", model: "GLS 450", trim: "4MATIC",
      year: 2021, regYear: 2021, price: 82000, negotiable: true, mileage: 54000,
      body: "suv", fuel: "hybrid", transmission: "automatic", drive: "awd",
      engine: "3.0 I6 + EQ Boost", power: 367, color: "black", condition: "clean", seats: 7,
      status: "available", featured: false, postedAt: "2026-08-27",
      images: photos("mercedes-gls-2021", 2), video: IG,
      description: {
        uz: "Mercedes-Benz GLS 450 — 7 oʻrinli katta premium SUV. 3.0 I6 + EQ Boost (yengil gibrid), pnevmo-osma, Burmester audio.\n54 000 km, tozza.",
        ru: "Mercedes-Benz GLS 450 — большой 7-местный премиальный SUV. 3.0 I6 + EQ Boost (мягкий гибрид), пневмоподвеска, аудио Burmester.\n54 000 км, без окрасов.",
      },
      features: ["leather", "panorama", "ventSeats", "heatedSeats", "camera360", "adaptiveCruise", "airSuspension", "premiumAudio", "thirdRow", "ambient", "powerTailgate"],
    },
    {
      id: "li-l9-2024",
      brand: "Li Auto", model: "L9", trim: "Max",
      year: 2024, regYear: 2025, price: 52000, negotiable: true, mileage: 14000,
      body: "suv", fuel: "hybrid", transmission: "automatic", drive: "awd",
      engine: "1.5T EREV + 2 motor", power: 449, color: "silver", condition: "clean", seats: 6,
      status: "available", featured: false, postedAt: "2026-09-30",
      images: photos("li-l9-2024", 3), video: IG,
      description: {
        uz: "Li Auto L9 Max — 6 oʻrinli flagman krossover, ketma-ket gibrid (EREV): faqat elektrda 200+ km, umumiy zapas 1100+ km.\nMuzlatkich, orqa qatorda ekranlar, massaj. 14 000 km.",
        ru: "Li Auto L9 Max — флагманский 6-местный кроссовер, последовательный гибрид (EREV): 200+ км на электротяге, общий запас хода 1100+ км.\nХолодильник, экраны сзади, массаж. 14 000 км.",
      },
      features: ["leather", "panorama", "massage", "ventSeats", "heatedSeats", "hud", "camera360", "autopilot", "airSuspension", "premiumAudio", "rearScreens", "fridge", "wirelessCharge"],
    },
    {
      id: "zeekr-001-2024",
      brand: "Zeekr", model: "001", trim: "YOU",
      year: 2024, regYear: 2024, price: 38000, negotiable: true, mileage: 9000,
      body: "liftback", fuel: "electric", transmission: "automatic", drive: "awd",
      engine: "100 kWh · 2 motor", power: 544, color: "grey", condition: "clean", seats: 5,
      status: "available", featured: false, postedAt: "2026-10-05",
      images: photos("zeekr-001-2024", 2), video: IG,
      description: {
        uz: "Zeekr 001 YOU — 100 kWh batareya, 2 elektromotor, 544 o.k. Bir zaryadda ~650 km gacha (CLTC).\nAvtopilot, pnevmo-osma. 9 000 km — deyarli yangi.",
        ru: "Zeekr 001 YOU — батарея 100 кВт·ч, 2 электромотора, 544 л.с. До ~650 км на одной зарядке (CLTC).\nАвтопилот, пневмоподвеска. 9 000 км — почти новый.",
      },
      features: ["leather", "panorama", "ventSeats", "heatedSeats", "hud", "camera360", "autopilot", "airSuspension", "premiumAudio", "keyless", "wirelessCharge", "ambient"],
    },

    /* ---------------- Baraka boʻldi (sotilgan) ---------------- */
    {
      id: "mercedes-g63-2021",
      brand: "Mercedes-Benz", model: "G 63 AMG", trim: "",
      year: 2021, regYear: 2021, price: 175000, negotiable: false, mileage: 21000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "4.0 V8 biturbo", power: 585, color: "black", condition: "clean", seats: 5,
      status: "sold", featured: false, postedAt: "2026-09-15", soldAt: "2026-09-28",
      images: photos("mercedes-g63-2021", 3), video: IG,
      description: {
        uz: "Mercedes-AMG G 63 — qora, 21 000 km. Yangi egasiga muborak boʻlsin! 🤝",
        ru: "Mercedes-AMG G 63 — чёрный, 21 000 км. Поздравляем нового владельца! 🤝",
      },
      features: ["leather", "sunroof", "massage", "ventSeats", "camera360", "premiumAudio", "offroad", "sportExhaust"],
    },
    {
      id: "chevrolet-silverado-z71-2017",
      brand: "Chevrolet", model: "Silverado", trim: "Z71 4x4",
      year: 2017, regYear: 2017, price: 36000, negotiable: false, mileage: 88000,
      body: "pickup", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "5.3 V8", power: 355, color: "black", condition: "clean", seats: 5,
      status: "sold", featured: false, postedAt: "2026-09-05", soldAt: "2026-09-20",
      images: photos("chevrolet-silverado-z71-2017", 3), video: IG,
      description: {
        uz: "Silverado Z71 4x4 offroad, 2017-yil. Baraka boʻldi — yangi egasiga muborak! 🤝",
        ru: "Silverado Z71 4x4 offroad, 2017 год. Продан — поздравляем нового владельца! 🤝",
      },
      features: ["leather", "heatedSeats", "offroad", "towHitch", "carplay"],
    },
    {
      id: "mercedes-g63-2020-grey",
      brand: "Mercedes-Benz", model: "G 63 AMG", trim: "",
      year: 2020, regYear: 2020, price: 158000, negotiable: false, mileage: 34000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "4.0 V8 biturbo", power: 585, color: "grey", condition: "clean", seats: 5,
      status: "sold", featured: false, postedAt: "2026-08-28", soldAt: "2026-09-12",
      images: photos("mercedes-g63-2020-grey", 1), video: IG,
      description: {
        uz: "Mercedes-AMG G 63 — mat kulrang. Baraka boʻldi! 🤝",
        ru: "Mercedes-AMG G 63 — матовый серый. Продан! 🤝",
      },
      features: ["leather", "sunroof", "massage", "camera360", "premiumAudio", "offroad"],
    },
    {
      id: "mercedes-g63-2022-green",
      brand: "Mercedes-Benz", model: "G 63 AMG", trim: "Green Hell Magno",
      year: 2022, regYear: 2022, price: 189000, negotiable: false, mileage: 12000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "4.0 V8 biturbo", power: 585, color: "green", condition: "clean", seats: 5,
      status: "sold", featured: false, postedAt: "2026-08-14", soldAt: "2026-08-30",
      images: photos("mercedes-g63-2022-green", 2), video: IG,
      description: {
        uz: "Kamyob rang — Green Hell Magno. Baraka boʻldi! 🤝",
        ru: "Редкий цвет — Green Hell Magno. Продан! 🤝",
      },
      features: ["leather", "sunroof", "massage", "camera360", "premiumAudio", "carbon", "sportExhaust"],
    },
    {
      id: "toyota-land-cruiser-200-2019",
      brand: "Toyota", model: "Land Cruiser 200", trim: "Excalibur",
      year: 2019, regYear: 2019, price: 64000, negotiable: false, mileage: 96000,
      body: "suv", fuel: "petrol", transmission: "automatic", drive: "4wd",
      engine: "4.6 V8", power: 309, color: "black", condition: "clean", seats: 7,
      status: "sold", featured: false, postedAt: "2026-08-02", soldAt: "2026-08-18",
      images: photos("toyota-land-cruiser-200-2019", 2), video: IG,
      description: {
        uz: "Land Cruiser 200 Excalibur — qora, tozza. Baraka boʻldi! 🤝",
        ru: "Land Cruiser 200 Excalibur — чёрный, без окрасов. Продан! 🤝",
      },
      features: ["leather", "sunroof", "ventSeats", "camera360", "thirdRow", "offroad"],
    },
  ];
})();
