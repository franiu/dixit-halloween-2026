/* =========================================================================
   UPIORNY SPACER · Filadelfia · 31.10.2026
   Wszystkie dane trasy i opowieści. Edytuj śmiało — to zwykły JS.
   ========================================================================= */
window.SPOOKY = {
  tz: 'America/New_York',

  // Godziny (czas Filadelfii, HH:MM)
  schedule: {
    start: '15:30',       // wyjście z parkingu
    meet: '15:40',        // spotkanie na Washington Square
    dinner: '16:30',      // rezerwacja
    leaveDinner: '18:25', // wyjście z kolacji (nocna trasa do teatru, ~10 min zapasu przed 19:00)
    show: '19:00',        // The Addams Family
    showEnd: '21:30',     // mniej więcej koniec spektaklu
    sunset: '18:02'
  },

  // ⚠️ PARKING i KOLACJA: podmień współrzędne/nazwy na prawdziwe.
  // Można też bez edycji kodu, przez link:
  //   ?dinner=39.948,-75.144&dinnerName=Nazwa%20restauracji&garage=39.95,-75.15&garageName=Parking
  places: {
    garage: {
      id: 'garage', name: 'Parking · 615 Chestnut St', emoji: '🚗',
      addr: '615 Chestnut St (między 6th a 7th)',
      lat: 39.94970, lng: -75.15200
    },
    dinner: {
      id: 'dinner', name: 'Brauhaus Schmitz', emoji: '🍺',
      sub: 'Kolacja 16:30 · 718 South St',
      addr: '718 South St (między 7th a 8th) · rezerwacja 16:30',
      lat: 39.94130, lng: -75.15400
    },
    theatre: {
      id: 'theatre', name: 'Walnut Street Theatre', emoji: '🎭',
      addr: '825 Walnut St · The Addams Family · 19:00',
      lat: 39.94810, lng: -75.15500
    }
  },

  // Bingo dekoracji — Society Hill słynie z przesadzonych dekoracji
  bingo: [
    { e: '💀', t: 'Szkielet w nietypowej pozie' },
    { e: '🕷️', t: 'Gigantyczny pająk' },
    { e: '🎃', t: 'Dynia z wyszczerzem' },
    { e: '🪦', t: 'Nagrobek w ogródku' },
    { e: '👻', t: 'Duch z prześcieradła' },
    { e: '🧙', t: 'Czarownica (lub jej miotła)' },
    { e: '🐈‍⬛', t: 'Czarny kot (prawdziwy = ×2)' },
    { e: '🕸️', t: 'Pajęczyna na drzwiach' },
    { e: '🦴', t: 'Szkielet psa lub kruka' }
  ],

  // ---------------------------------------------------------------------
  // PRZYSTANKI
  // phase: 'walk' (przed kolacją) · 'night' (kolacja → teatr) · 'bonus'
  // optional: można pominąć, gdy brakuje czasu
  // ---------------------------------------------------------------------
  stops: [
    {
      id: 'wash', phase: 'walk', emoji: '⚰️', dwell: 4,
      name: 'Washington Square',
      sub: 'Plac, pod którym śpią tysiące',
      lat: 39.94700, lng: -75.15255, radius: 90,
      era: '1704 · 1777 · 1793',
      story: [
        'Dziś to elegancki park z fontanną i wiewiórkami. Ale przez prawie sto lat był to <b>„potter’s field”</b> — cmentarz dla biednych, obcych i tych, których nikt nie chciał.',
        'W czasie rewolucji chowano tu w masowych dołach żołnierzy — Amerykanów i jeńców brytyjskich, którzy umierali tuzinami w więzieniu po drugiej stronie ulicy. W 1793 r. dołączyły do nich ofiary <b>żółtej febry</b>. Pod waszymi stopami leżą prawdopodobnie tysiące ludzi.',
        'Od 1957 r. stoi tu <b>Grób Nieznanego Żołnierza Rewolucji</b>. Napis głosi: <i>„Wolność jest światłem, za które wielu ludzi zginęło w ciemności”</i>.'
      ],
      dark: 'Szczątki w grobowcu wykopano tu, w parku. Nikt nie wie, czyje są. Ten „nieznany żołnierz” mógł równie dobrze walczyć… po stronie Brytyjczyków.',
      legend: 'Legenda mówi o <b>Leah</b>, kwakierce, która nocami pilnowała grobów przed porywaczami zwłok — studenci medycyny płacili za świeże ciała. Podobno pilnuje do dziś. Jeśli poczujecie chłód na karku przy grobowcu… to tylko Leah sprawdza, po co przyszliście.',
      bonusFact: 'W parku rośnie też „Księżycowe Drzewo” — potomek platana z nasion, które w 1971 r. poleciały wokół Księżyca na Apollo 14.',
      ritual: { label: '🕯️ Zapal znicz dla nieznanego', fx: 'candle', done: 'Płomień zadrżał. Ktoś… podziękował.' },
      quiz: {
        q: 'Kto spoczywa w Grobie Nieznanego Żołnierza?',
        a: ['Generał Waszyngtona', 'Nikt nie wie — może nawet Brytyjczyk', 'Ofiara żółtej febry', 'Benjamin Franklin'],
        ok: 1, why: 'Szczątki są anonimowe — strona konfliktu też jest zagadką.'
      },
      links: [
        { t: 'Wikipedia', u: 'https://en.wikipedia.org/wiki/Washington_Square_(Philadelphia)' },
        { t: 'NPS', u: 'https://www.nps.gov/inde/learn/historyculture/places-washingtonsquare.htm' }
      ]
    },
    {
      id: 'jail', phase: 'bonus', emoji: '🎈', dwell: 2,
      name: 'Więzienie przy Walnut Street',
      sub: 'Cele, febra i… balon',
      lat: 39.94735, lng: -75.15080, radius: 60,
      era: '1773–1838',
      story: [
        'Na rogu 6th & Walnut stało niegdyś <b>Walnut Street Jail</b>. Podczas brytyjskiej okupacji (1777–78) setki amerykańskich jeńców umierało tu z głodu i zimna — wielu trafiło potem prosto do dołów na Washington Square.',
        'Później to tu narodziła się idea <b>więzienia-penitencjarnej celi</b>: samotność i cisza miały prowadzić do „pokuty”. Pomysł potem przerodził się w słynne Eastern State Penitentiary.'
      ],
      dark: 'Paradoks: 9 stycznia 1793 r. z więziennego dziedzińca wystartował <b>pierwszy w Ameryce lot balonem</b> (Jean-Pierre Blanchard). Patrzył prezydent Washington. Więźniowie mogli tylko patrzeć w górę.',
      legend: 'Na miejscu więzienia stoją dziś biurowce. Ochroniarze nocnych zmian podobno nie lubią pustych korytarzy na parterze.',
      ritual: { label: '🎈 Wypuść balon', fx: 'balloon', done: 'Odleciał. Szczęściarz.' },
      quiz: {
        q: 'Co wystartowało z dziedzińca więzienia w 1793 r.?',
        a: ['Pierwszy balon w Ameryce', 'Ucieczka 40 więźniów', 'Pierwsza poczta', 'Fajerwerki'],
        ok: 0, why: 'Lot Blancharda oglądał sam George Washington.'
      },
      links: [{ t: 'Wikipedia', u: 'https://en.wikipedia.org/wiki/Walnut_Street_Prison' }]
    },
    {
      id: 'library', phase: 'bonus', emoji: '📚', dwell: 2,
      name: 'Library Hall · Duch Franklina',
      sub: 'Franklin wciąż oddaje książki',
      lat: 39.94835, lng: -75.14915, radius: 60,
      era: '1789 · legenda XIX w.',
      story: [
        'Budynek Library Hall (rekonstrukcja dawnej Library Company, którą założył <b>Benjamin Franklin</b>) należy dziś do American Philosophical Society. Na fasadzie stoi posąg Franklina w todze.',
        'Franklin był drukarzem, wynalazcą, dyplomatą, żartownisiem — i najwyraźniej nie umie przestać.'
      ],
      dark: 'Najsłynniejsza filadelfijska historia o duchu: sprzątaczka miała wpaść tu na Franklina obładowanego książkami — długo po jego śmierci. Inni twierdzą, że to <b>posąg</b> schodzi nocą z cokołu i tańczy na ulicy.',
      legend: 'Jeśli posąg nie stoi dokładnie tak, jak na zdjęciach w internecie… nie mówcie nikomu.',
      ritual: { label: '⚡ Puść latawiec w burzę', fx: 'lightning', done: 'Iskra! Franklin byłby dumny.' },
      quiz: {
        q: 'Co według legendy robi nocą posąg Franklina?',
        a: ['Czyta gazetę', 'Schodzi i tańczy na ulicy', 'Płacze', 'Gra na harmonijce szklanej'],
        ok: 1, why: 'Choć Franklin naprawdę wynalazł harmonijkę szklaną — a ludzie wierzyli, że jej dźwięk doprowadza do szaleństwa!'
      },
      links: [{ t: 'APS', u: 'https://www.amphilsoc.org/' }]
    },
    {
      id: 'carpenters', phase: 'bonus', emoji: '💰', dwell: 2,
      name: "Carpenters' Hall",
      sub: 'Pierwszy napad na bank w USA',
      lat: 39.94810, lng: -75.14720, radius: 60,
      era: '1774 · 1798',
      story: [
        'Tu w 1774 r. obradował <b>Pierwszy Kongres Kontynentalny</b>. Ale nas interesuje noc z 1 września 1798 r.',
        'Mieścił się tu wtedy Bank of Pennsylvania. Ktoś wyniósł ponad <b>160 000 dolarów</b>. Podejrzenie padło na kowala Patricka Lyona, który robił zamki do skarbca — trafił do więzienia przy Walnut Street.'
      ],
      dark: 'Prawdziwy złodziej, Isaac Davis, członek cechu stolarzy, wpłacał skradzione pieniądze… do tego samego banku. Za wcześnie zaczął być bogaty.',
      legend: 'Nocni strażnicy opowiadali o krokach i stukaniu na piętrze, gdy budynek był pusty. Może Davis wciąż czegoś szuka.',
      ritual: { label: '🔐 Spróbuj otworzyć skarbiec', fx: 'bell', done: 'Klik. Pusto. Ktoś był tu przed wami.' },
      quiz: {
        q: 'Gdzie złodziej zdeponował łup?',
        a: ['W ogródku', 'W okradzionym banku', 'W Nowym Jorku', 'Pod podłogą kościoła'],
        ok: 1, why: 'Bezczelność czy geniusz? Raczej to pierwsze.'
      },
      links: [{ t: "Carpenters' Hall", u: 'https://www.carpentershall.org/' }]
    },
    {
      id: 'todd', phase: 'walk', emoji: '🦟', dwell: 2,
      name: 'Dom Dolley Todd',
      sub: 'Żółta febra, 1793',
      lat: 39.94720, lng: -75.14800, radius: 55,
      era: '1793',
      story: [
        'Latem 1793 r. Filadelfia była stolicą USA. Wtedy przyszła <b>żółta febra</b>. W kilka miesięcy zmarło około 5000 osób — mniej więcej co dziesiąty mieszkaniec. Rząd uciekł z miasta.',
        'W tym domu mieszkała młoda kwakierka <b>Dolley Todd</b>. 24 października tego samego dnia zmarli jej mąż John i nowonarodzony syn.'
      ],
      dark: 'Ludzie żuli czosnek, palili proch strzelniczy, polewali się octem, puszczano im krew. Nic nie działało — bo nikt nie wiedział, że winne są <b>komary</b>. Dopiero przymrozki zatrzymały epidemię.',
      legend: 'Dolley wyszła potem za Jamesa Madisona i jako Pierwsza Dama uratowała z płonącego Białego Domu portret Waszyngtona. Z wdowy po febrze — w legendę.',
      ritual: { label: '🧄 Odpędź febrę (sposób z 1793)', fx: 'ghost', done: 'Pachniecie czosnkiem i octem. Komary są zachwycone.' },
      quiz: {
        q: 'Co naprawdę roznosiło żółtą febrę?',
        a: ['Zatrute studnie', 'Komary', 'Szczury', 'Mgła znad rzeki'],
        ok: 1, why: 'Udowodniono to dopiero w 1900 r. (Walter Reed na Kubie).'
      },
      links: [
        { t: 'NPS', u: 'https://www.nps.gov/inde/planyourvisit/toddhouse.htm' },
        { t: 'Febra 1793', u: 'https://en.wikipedia.org/wiki/1793_Philadelphia_yellow_fever_epidemic' }
      ]
    },
    {
      id: 'white', phase: 'walk', emoji: '📿', dwell: 1, optional: true,
      name: 'Dom biskupa White’a',
      sub: 'Ten, który nie uciekł',
      lat: 39.94735, lng: -75.14675, radius: 50,
      era: '1787',
      story: [
        '<b>William White</b> — kapelan Kongresu Kontynentalnego, pierwszy biskup episkopalny w USA, przyjaciel Waszyngtona i Franklina. Zbudował ten dom w 1787 r.',
        'Gdy w 1793 r. bogaci uciekali przed febrą, White został w mieście i odwiedzał chorych.'
      ],
      dark: 'Dom miał jak na tamte czasy luksus: <b>wychodek wewnątrz domu</b>. Nowoczesność! Choć zapachowo… dyskusyjna.',
      legend: 'Przewodnicy opowiadają o postaci w czerni widywanej w bibliotece na piętrze. Biskup podobno nadal pracuje nad kazaniem.',
      ritual: { label: '🔔 Zadzwoń na mszę', fx: 'bell', done: 'Dzwon odbił się echem od cegieł Society Hill.' },
      quiz: {
        q: 'Co było nowinką w domu biskupa?',
        a: ['Lodówka', 'Wewnętrzna toaleta', 'Winda', 'Gazowe światło'],
        ok: 1, why: 'XVIII-wieczny luksus. Nie pytajcie o kanalizację.'
      },
      links: [{ t: 'NPS', u: 'https://www.nps.gov/inde/planyourvisit/bishopwhitehouse.htm' }]
    },
    {
      id: 'powel', phase: 'walk', emoji: '🕰️', dwell: 2, optional: true,
      name: 'Powel House',
      sub: 'Salon, febra i rozebrany dom',
      lat: 39.94545, lng: -75.14700, radius: 50,
      era: '1765 · 1793 · 1931',
      story: [
        'Tu mieszkał <b>Samuel Powel</b>, „burmistrz-patriota”, i jego żona <b>Elizabeth</b> — najbystrzejsza gospodyni salonu w mieście. Bywał tu Waszyngton (także na rocznicy ślubu), Adams, Lafayette.',
        'Według jednej wersji słynnej anegdoty to właśnie Elizabeth zapytała Franklina po Konwencji: „Co nam daliście — republikę czy monarchię?” — „Republikę, o ile zdołacie ją utrzymać”.'
      ],
      dark: 'Febra 1793 zabrała i Samuela. W XX w. dom zamieniono w magazyn, a dwa jego wnętrza wymontowano i sprzedano do muzeów w Nowym Jorku i Filadelfii. W 1931 r. dom w ostatniej chwili ocalono przed rozbiórką.',
      legend: 'Mówi się, że Elizabeth nigdy nie przestała przyjmować gości. Jeśli coś zaszeleści za oknem — to suknia, nie wiatr.',
      ritual: { label: '💃 Zatańcz menueta z duchem', fx: 'ghost', done: 'Ukłon. Duch prowadził.' },
      quiz: {
        q: '„Republika, o ile zdołacie ją ___”. Czego brakuje?',
        a: ['pokochać', 'utrzymać', 'zrozumieć', 'opłacić'],
        ok: 1, why: '„A republic, if you can keep it.” Temat zaskakująco aktualny.'
      },
      links: [{ t: 'Powel House', u: 'https://www.philalandmarks.org/powel-house' }]
    },
    {
      id: 'kosciuszko', phase: 'walk', emoji: '🇵🇱', dwell: 4,
      name: 'Dom Kościuszki',
      sub: 'Nasz bohater · najmniejszy park narodowy USA',
      lat: 39.94344, lng: -75.14728, radius: 50,
      era: '1797–1798',
      story: [
        'Zimą 1797/98 r. w pokoiku na piętrze tego pensjonatu mieszkał <b>Tadeusz Kościuszko</b> — po klęsce powstania, ranny pod Maciejowicami, świeżo wypuszczony z rosyjskiej niewoli. Ledwo chodził.',
        'Odwiedzali go tu <b>Thomas Jefferson</b> i wódz Miami <b>Mały Żółw (Little Turtle)</b>. Kościuszko podarował mu parę pistoletów — by bronił swojego ludu.',
        'To dziś <b>najmniejsza jednostka systemu parków narodowych USA</b>.'
      ],
      dark: 'Kościuszko spoczywa w trzech miejscach naraz: ciało na <b>Wawelu</b>, serce w <b>Zamku Królewskim w Warszawie</b>, a wnętrzności w szwajcarskim <b>Zuchwil</b>. Bardzo halloweenowe.',
      legend: 'Testamentem zostawił swoje amerykańskie pieniądze Jeffersonowi, by wykupić i wykształcić zniewolonych ludzi. Jefferson nigdy tego nie wykonał. Może dlatego ktoś tu wciąż czeka przy oknie na piętrze.',
      ritual: { label: '⚔️ Salutuj Naczelnikowi', fx: 'drum', done: 'Za wolność naszą i waszą!' },
      quiz: {
        q: 'Gdzie dziś znajduje się serce Kościuszki?',
        a: ['Na Wawelu', 'W Filadelfii', 'Zamek Królewski w Warszawie', 'W Szwajcarii'],
        ok: 2, why: 'Z Rapperswilu wróciło do Polski w 1927 r.'
      },
      links: [
        { t: 'NPS', u: 'https://www.nps.gov/thko/' },
        { t: 'Wikipedia (PL)', u: 'https://pl.wikipedia.org/wiki/Tadeusz_Ko%C5%9Bciuszko' }
      ]
    },
    {
      id: 'stpeters', phase: 'walk', emoji: '🪦', dwell: 3,
      name: 'Cmentarz św. Piotra',
      sub: 'Pojedynki, ospa i kamienne anioły',
      lat: 39.94280, lng: -75.14760, radius: 60,
      era: '1761',
      story: [
        'Kościół św. Piotra (1761) z wysoką wieżą i zielonym cmentarzem to perła Society Hill. Spoczywa tu m.in. malarz <b>Charles Willson Peale</b> i komandor <b>Stephen Decatur</b>, bohater wojny z piratami berberyjskimi.',
        'Decatur zginął w 1820 r. w <b>pojedynku</b> z innym oficerem marynarki, Jamesem Barronem. Obaj trafili. Przeżył tylko Barron.'
      ],
      dark: 'W tym samym 1793 r., gdy szalała febra, na ospę zmarło tu kilku <b>wodzów rdzennych narodów</b>, przybyłych na rozmowy pokojowe. Pochowano ich na tym cmentarzu — przypomina o tym tablica.',
      legend: 'Ławki w środku są „pudełkowe” — z drzwiczkami. Ponoć czasem, gdy kościół jest pusty, ktoś słyszy, jak jedne z nich cicho się zamykają.',
      ritual: { label: '🔫 Odlicz do pojedynku: 1… 2… 3', fx: 'duel', done: 'Pudło. Tym razem.' },
      quiz: {
        q: 'Jak zginął Stephen Decatur?',
        a: ['Na morzu', 'W pojedynku', 'Na febrę', 'Spadł z wieży'],
        ok: 1, why: 'Pojedynki były wtedy nielegalne… i popularne.'
      },
      links: [{ t: "St. Peter's", u: 'https://www.stpetersphila.org/' }]
    },
    {
      id: 'oldpine', phase: 'walk', emoji: '🐴', dwell: 2, optional: true,
      name: 'Old Pine Street Church',
      sub: 'Kościół, który był stajnią',
      lat: 39.94300, lng: -75.14900, radius: 55,
      era: '1768 · 1777',
      story: [
        'Prezbiteriański „Kościół Patriotów” z 1768 r. Gdy w 1777 r. Brytyjczycy zajęli Filadelfię, zrobili z niego <b>szpital</b>, a potem <b>stajnię dla kawalerii</b>. Ławki poszły na opał.',
        'Na cmentarzu leży około stu żołnierzy rewolucji.'
      ],
      dark: 'Według tradycji pochowano tu też w nieoznakowanych grobach <b>heskich najemników</b> — Niemców wynajętych przez Brytyjczyków, którzy zmarli w kościelnym szpitalu. Wrogowie leżą obok siebie.',
      legend: 'Opowieści o żołnierzu w obcym mundurze, który pyta o drogę… w języku, którego nikt nie rozumie.',
      ritual: { label: '🐎 Posłuchaj kopyt', fx: 'hooves', done: 'Stuk… stuk… stuk. Kawaleria odjechała.' },
      quiz: {
        q: 'Czym był ten kościół podczas brytyjskiej okupacji?',
        a: ['Więzieniem', 'Stajnią i szpitalem', 'Teatrem', 'Magazynem prochu'],
        ok: 1, why: 'Konie w nawie. Pastor nie był zachwycony.'
      },
      links: [{ t: 'Old Pine', u: 'https://www.oldpine.org/' }]
    },
    {
      id: 'physick', phase: 'walk', emoji: '🩺', dwell: 2,
      name: 'Dom doktora Physicka',
      sub: 'Ojciec chirurgii… i porywacze zwłok',
      lat: 39.94430, lng: -75.14840, radius: 50,
      era: '1786 · 1793 · 1837',
      story: [
        '<b>Philip Syng Physick</b> — „ojciec amerykańskiej chirurgii” — mieszkał w tym jedynym wolnostojącym domu federalnym w Society Hill. Przeżył żółtą febrę, leczył chorych w 1793 r.',
        'Usunął prezesowi Sądu Najwyższego Johnowi Marshallowi z pęcherza <b>ponad tysiąc kamieni</b>. Bez znieczulenia. Przypisuje mu się też wymyślenie <b>gazowanego napoju owocowego</b> jako lekarstwa — prapradziadka sody.'
      ],
      dark: 'Physick wiedział, skąd jego studenci biorą zwłoki do ćwiczeń. Dlatego zażądał, by jego grób był <b>strzeżony przez wiele tygodni po pogrzebie</b> — aż ciało stanie się „bezużyteczne” dla porywaczy.',
      legend: 'W ogrodzie za domem podobno coś grzebie w ziemi nocą. Ogrodnicy mówią, że to wiewiórki.',
      ritual: { label: '🫀 Posłuchaj bicia serca', fx: 'heartbeat', done: 'Pacjent żyje. Na razie.' },
      quiz: {
        q: 'Ile kamieni Physick usunął Johnowi Marshallowi?',
        a: ['3', 'Około 40', 'Ponad 1000', 'Żadnego — pacjent uciekł'],
        ok: 2, why: 'I pacjent przeżył operację!'
      },
      links: [{ t: 'Physick House', u: 'https://www.philalandmarks.org/hill-physick-house' }]
    },
    {
      id: 'stmarys', phase: 'bonus', emoji: '✝️', dwell: 2,
      name: 'Old St. Mary’s',
      sub: 'Ojciec marynarki pod liśćmi',
      lat: 39.94570, lng: -75.14870, radius: 50,
      era: '1763 · 1779',
      story: [
        'Jeden z najstarszych kościołów katolickich w USA. 4 lipca 1779 r. odprawiono tu <b>pierwsze publiczne nabożeństwo upamiętniające Deklarację Niepodległości</b> — z udziałem Kongresu.',
        'Na przykościelnym cmentarzu leży komandor <b>John Barry</b>, „ojciec amerykańskiej marynarki wojennej”.'
      ],
      dark: 'Nagrobki są tak stare, że napisy się zatarły — wiele grobów jest dziś anonimowych. Kto pod którym kamieniem? Tylko liście wiedzą.',
      legend: 'Mówi się, że w mgliste noce po cmentarzu snuje się zapach morskiej soli. Barry sprawdza wachtę.',
      ritual: { label: '⚓ Zabij w dzwon okrętowy', fx: 'bell', done: 'Osiem szklanek. Zmiana wachty.' },
      quiz: {
        q: 'Kogo nazywa się „ojcem amerykańskiej marynarki”?',
        a: ['John Barry', 'Stephen Decatur', 'John Paul Jones', 'Benjamin Franklin'],
        ok: 0, why: 'Choć fani Johna Paula Jonesa się kłócą.'
      },
      links: [{ t: 'Wikipedia', u: "https://en.wikipedia.org/wiki/Old_St._Mary%27s_Church_(Philadelphia)" }]
    },
    {
      id: 'bethel', phase: 'walk', emoji: '⛪', dwell: 3,
      name: 'Mother Bethel AME',
      sub: 'Ci, którzy grzebali zmarłych w 1793',
      lat: 39.94290, lng: -75.15190, radius: 55,
      era: '1787 · 1793 · 1794',
      story: [
        '<b>Richard Allen</b> urodził się w niewoli, wykupił się na wolność i założył tu pierwszy kościół <b>African Methodist Episcopal</b> — dziś wspólnotę liczącą miliony wiernych na całym świecie. Ta działka uważana jest za najstarszy grunt w USA nieprzerwanie należący do czarnoskórych właścicieli.',
        'Gdy w 1793 r. biali mieszkańcy uciekali przed febrą, Allen i <b>Absalom Jones</b> zorganizowali czarnoskórą społeczność Filadelfii: pielęgnowali chorych, wozili i grzebali zmarłych, gdy nikt inny nie chciał.'
      ],
      dark: 'Poprosił ich o to dr Benjamin Rush — bo <b>błędnie wierzył, że czarnoskórzy są odporni na żółtą febrę</b>. Nie byli. Umierali tak samo. A po epidemii jeden z wydawców oskarżył ich jeszcze o… żerowanie na zmarłych. Allen i Jones odpowiedzieli w 1794 r. pamfletem — jednym z pierwszych tekstów politycznych czarnoskórych autorów w USA.',
      legend: 'Grobowiec Richarda Allena i jego żony Sarah jest w krypcie pod kościołem. Mówi się, że gdy na ulicy robi się zbyt głośno, ze środka dobiega jeden, spokojny ton organów.',
      ritual: { label: '🔔 Zadzwoń za tych, którzy zostali', fx: 'bell', done: 'Dźwięk niesie się aż do Washington Square.' },
      quiz: {
        q: 'Dlaczego Rush poprosił czarnoskórych mieszkańców o pomoc przy febrze?',
        a: ['Bo byli lekarzami', 'Bo błędnie wierzył, że są odporni', 'Bo zapłacił im fortunę', 'Bo nakazał to Waszyngton'],
        ok: 1, why: 'Mit o „odporności” kosztował wiele istnień.'
      },
      links: [
        { t: 'Mother Bethel', u: 'https://www.motherbethel.org/' },
        { t: 'Wikipedia', u: 'https://en.wikipedia.org/wiki/Mother_Bethel_A.M.E._Church' }
      ]
    },
    {
      id: 'headhouse', phase: 'bonus', emoji: '🧺', dwell: 2,
      name: 'Head House Square',
      sub: 'Targ z 1745 r.',
      lat: 39.94190, lng: -75.14510, radius: 60,
      era: '1745 · 1804',
      story: [
        'Kryty targ <b>Shambles</b> działa tu od 1745 r. — jeden z najstarszych w USA. „Head House” na końcu to remiza strażacka z 1804 r. z dzwonem alarmowym.',
        '„Shambles” znaczyło kiedyś… ubojnię. Rzeźnicy rąbali tu mięso pod gołym niebem.'
      ],
      dark: 'Wieczorami, gdy kramy są puste, rząd kamiennych kolumn wygląda jak długi korytarz bez końca. Idealny na zdjęcie grupowe z „kimś dodatkowym”.',
      legend: 'Jeśli na zdjęciu będzie was o jedną osobę więcej — nie liczcie ponownie.',
      ritual: { label: '📸 Zrób zdjęcie z duchem', fx: 'flash', done: 'Policzcie ludzi na zdjęciu. Dwa razy.' },
      quiz: {
        q: 'Co pierwotnie znaczyło słowo „shambles”?',
        a: ['Ruiny', 'Ubojnia / jatki', 'Rynek rybny', 'Bałagan'],
        ok: 1, why: 'Stąd dzisiejsze „it’s a shambles” = kompletny chaos.'
      },
      links: [{ t: 'Wikipedia', u: 'https://en.wikipedia.org/wiki/Head_House_Square' }]
    },

    // ----------------------- NOCNA TRASA (kolacja → teatr) -----------------
    {
      id: 'mikveh', phase: 'night', emoji: '✡️', dwell: 3, optional: true,
      name: 'Cmentarz Mikveh Israel',
      sub: 'Polak, który sfinansował rewolucję',
      lat: 39.94545, lng: -75.15650, radius: 55,
      era: '1740',
      story: [
        'Jeden z najstarszych cmentarzy żydowskich w USA (1740). Spoczywa tu <b>Haym Salomon</b>, urodzony w <b>Lesznie</b> — polski Żyd, który pożyczał i zbierał pieniądze na rewolucję amerykańską. Zmarł w biedzie, a jego grób nie jest oznaczony.',
        'Leży tu też <b>Rebecca Gratz</b> — według tradycji pierwowzór Rebeki z „Ivanhoe” Waltera Scotta.'
      ],
      dark: 'Nikt nie wie, w którym miejscu dokładnie leży Salomon. Jest tu — ale wszędzie i nigdzie.',
      legend: 'Kładzie się tu kamyki zamiast kwiatów. Kamień nie więdnie — pamięć też nie powinna.',
      ritual: { label: '🪨 Połóż kamyk pamięci', fx: 'stone', done: 'Pamiętamy.' },
      quiz: {
        q: 'W jakim polskim mieście urodził się Haym Salomon?',
        a: ['Kraków', 'Leszno', 'Lublin', 'Gdańsk'],
        ok: 1, why: 'Leszno w Wielkopolsce, ok. 1740 r.'
      },
      links: [{ t: 'Wikipedia (PL)', u: 'https://pl.wikipedia.org/wiki/Haym_Salomon' }]
    },
    {
      id: 'hospital', phase: 'night', emoji: '🏥', dwell: 3, optional: true,
      name: 'Pennsylvania Hospital',
      sub: 'Amfiteatr, w którym nikt nie spał',
      lat: 39.94460, lng: -75.15600, radius: 60,
      era: '1751 · 1804',
      story: [
        'Pierwszy szpital w USA (1751), założony przez <b>Benjamina Franklina</b> i dr. Thomasa Bonda. Na poddaszu jest <b>najstarszy w Ameryce amfiteatr chirurgiczny</b> (1804).',
        'Operowano tylko w słoneczne dni, w południe — pod świetlikiem, bo nie było elektryczności. Bez znieczulenia. Dziesiątki studentów patrzyło z ław.'
      ],
      dark: 'W piwnicach trzymano chorych psychicznie. Według relacji mieszkańcy miasta przychodzili ich <b>oglądać</b> jak atrakcję. Smutniejsze niż każda legenda.',
      legend: 'Nocni pracownicy mówią o krokach na pustych schodach do amfiteatru. Może student, który spóźnił się na wykład — o dwieście lat.',
      ritual: { label: '🔪 Asystuj przy operacji', fx: 'scream', done: 'Pacjent przeżył. Wy — ledwo.' },
      quiz: {
        q: 'Dlaczego operowano w południe w słoneczne dni?',
        a: ['Przesąd', 'Dla światła — nie było prądu', 'Bo chirurdzy pili wieczorami', 'Ze względu na koszty'],
        ok: 1, why: 'Świetlik w dachu był jedyną „lampą operacyjną”.'
      },
      links: [{ t: 'Historia szpitala', u: 'https://www.uphs.upenn.edu/paharc/' }]
    },
    {
      id: 'theatre', phase: 'night', emoji: '🎭', dwell: 0, isPlace: true,
      name: 'Walnut Street Theatre',
      sub: 'Najstarszy teatr Ameryki · The Addams Family',
      lat: 39.94810, lng: -75.15500, radius: 70,
      era: '1809',
      story: [
        'Otwarty w 1809 r. — początkowo jako… <b>cyrk</b>. To najstarszy wciąż działający teatr w USA. W 1837 r. jako pierwszy dostał gazowe oświetlenie rampy.',
        'Grali tu najwięksi aktorzy XIX w., a od 1865 r. współwłaścicielem był <b>Edwin Booth</b> — wybitny tragik i brat <b>Johna Wilkesa Bootha</b>, zabójcy Lincolna.'
      ],
      dark: 'Teatry mają swój przesąd: na noc zostawia się zapaloną jedną lampę na pustej scenie — <i>ghost light</i>. Oficjalnie: żeby nikt nie wpadł do kanału orkiestry. Nieoficjalnie: żeby duchy mogły zagrać swój spektakl.',
      legend: 'Dziś wieczorem na scenie pojawi się cała rodzina, która uważa śmierć za coś zupełnie normalnego. Czujcie się jak w domu.',
      ritual: { label: '🫰 Pstryk! Pstryk!', fx: 'snap', done: 'Da-da-da-dum. 🫰🫰' },
      quiz: {
        q: 'Czym był Walnut Street Theatre na początku?',
        a: ['Kościołem', 'Cyrkiem', 'Więzieniem', 'Targiem'],
        ok: 1, why: 'Konie i akrobaci zanim przyszli tragicy.'
      },
      links: [{ t: 'Walnut Street Theatre', u: 'https://www.walnutstreettheatre.org/' }]
    }
  ],

  // Kolejność trasy przed kolacją i po kolacji
  walkOrder: ['wash', 'todd', 'white', 'powel', 'kosciuszko', 'stpeters', 'physick', 'oldpine', 'bethel'],
  nightOrder: ['hospital', 'mikveh', 'theatre'],

  // Historie „do opowiedzenia przy stole”
  tableTales: [
    'W 1793 r. pewien lekarz zalecał przeciw febrze… strzelanie z armat na ulicach, by „oczyścić powietrze”. Naprawdę to robiono.',
    'Wożący zwłoki w czasie febry mieli dzwonki. Kiedy ich słyszano, zamykano okiennice. Na wózek trafiali czasem ludzie, którzy… jeszcze żyli.',
    'Pierwszy rysunek z rodziną Addamsów ukazał się w „The New Yorker” w 1938 r. Imiona (Morticia, Gomez, Wednesday…) dostali dopiero w latach 60., gdy powstał serial.',
    'Edgar Allan Poe mieszkał w Filadelfii ok. 6 lat i napisał tu m.in. „Złotego żuka” i „Zabójstwo przy Rue Morgue”. Jego dom jest kilkanaście przecznic na północ.',
    'Eastern State Penitentiary (kilka km stąd) miało celę Al Capone’a — z dywanem, lampą i radiem.',
    'Charles Addams, twórca rodziny Addamsów, podobno jako dziecko zakradał się na cmentarze i został przyłapany w opuszczonym domu. Wiele mu to dało.',
    'W 1793 r. Benjamin Rush leczył febrę upuszczaniem krwi — czasem upuszczał pacjentom aż do omdlenia. Sam przeżył febrę. Wielu pacjentów — nie.'
  ]
};
