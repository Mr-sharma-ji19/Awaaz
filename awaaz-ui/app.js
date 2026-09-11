import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase.js";

const fallbackDemo = [
  {
    id: "demo-1",
    title: "बारिश के बाद की वह शाम",
    subtitle: "एक शहर, एक खिड़की और बहुत देर तक ठहरी हुई बारिश।",
    category: "कहानी",
    author: "Awaaz Editorial",
    status: "published",
    date: "11 Sep 2026",
    image:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=85",
    content:
      "शाम धीरे-धीरे शहर पर उतर रही थी। खिड़की के शीशे पर बारिश की आखिरी बूंदें अब भी अपना रास्ता खोज रही थीं।\n\nसड़क पर लोग जल्दी में थे, लेकिन कमरे के भीतर समय कुछ धीमा पड़ गया था। उसने चाय का कप उठाया और सामने की खाली कुर्सी को देखा। कुछ लोग चले जाते हैं, पर उनकी कही हुई बातें कमरे में रह जाती हैं।\n\nउस शाम उसे पहली बार लगा कि यादें भी आवाज़ रखती हैं—बस उन्हें सुनने के लिए थोड़ी खामोशी चाहिए।",
  },
  {
    id: "demo-2",
    title: "शहर की सुबह: क्या बदल रहा है?",
    subtitle: "आज की कुछ जरूरी बातें, बिना शोर और जल्दबाजी के।",
    category: "खबर",
    author: "Awaaz Desk",
    status: "published",
    date: "11 Sep 2026",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=85",
    content:
      "हर सुबह शहर अपने साथ नई खबरें लेकर आता है। इस पोस्ट में हम जरूरी घटनाओं को सरल भाषा में समझते हैं, ताकि सूचना शोर न बने।\n\nकिसी भी खबर को साझा करने से पहले उसके स्रोत और तारीख को देखना जरूरी है। यहाँ प्रकाशित सामग्री को संपादकीय टीम द्वारा पढ़कर और व्यवस्थित करके प्रस्तुत किया जाता है।",
  },
  {
    id: "demo-3",
    title: "धीरे पढ़ना भी एक कला है",
    subtitle: "स्क्रीन की रफ्तार के बीच अपने लिए कुछ मिनट बचाने की बात।",
    category: "विचार",
    author: "Awaaz Editorial",
    status: "published",
    date: "10 Sep 2026",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=85",
    content:
      "हम हर दिन सैकड़ों शब्द देखते हैं, लेकिन कितने शब्द सच में पढ़ते हैं?\n\nधीरे पढ़ना किसी पुराने समय में लौटना नहीं है। यह बस इतना है कि जब कोई विचार सामने आए तो उसे कुछ पल दिए जाएँ। एक पैराग्राफ पूरा करें, साँस लें और फिर आगे बढ़ें।\n\nAwaaz इसी छोटे से ठहराव की जगह बनना चाहता है।",
  },
];

let allPosts = [];
let current = null;
let rate = 1;

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m])
  );

function formatDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return "";
}

function getSortTime(post) {
  if (!post) return 0;

  if (post.createdAt?.toDate) {
    return post.createdAt.toDate().getTime();
  }

  if (typeof post.createdAt === "string") {
    const time = new Date(post.createdAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  return 0;
}

/* -------------------------------------------------
   FIRESTORE
------------------------------------------------- */

async function loadPosts() {
  try {
    const q = query(
      collection(db, "posts"),
      where("status", "==", "published")
    );

    const snap = await getDocs(q);

    allPosts = snap.docs
      .map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          date: formatDate(data.createdAt),
        };
      })
      .sort((a, b) => getSortTime(b) - getSortTime(a));

    console.info(
      `Awaaz: ${allPosts.length} published Firestore post(s) loaded.`
    );
  } catch (error) {
    console.error("Firestore load failed:", error);

    allPosts = [...fallbackDemo].sort(
      (a, b) => getSortTime(b) - getSortTime(a)
    );
  }

  render();
}

/* -------------------------------------------------
   STORY CARD
   Every story uses the SAME structure.
------------------------------------------------- */

function createStoryCard(post) {
  return `
    <article class="post reveal" data-id="${escapeHtml(post.id)}">

      <div class="post-img">
        <img
          src="${escapeHtml(
            post.image ||
              "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=85"
          )}"
          alt="${escapeHtml(post.title)}"
          loading="lazy"
        >
      </div>

      <div class="post-copy">

        <span class="post-cat">
          ${escapeHtml(post.category || "कहानी")}
          ${post.date ? ` — ${escapeHtml(post.date)}` : ""}
        </span>

        <h3>${escapeHtml(post.title || "")}</h3>

        ${
          post.subtitle
            ? `<p>${escapeHtml(post.subtitle)}</p>`
            : ""
        }

        <span class="post-read">
          पढ़ें / सुनें ↗
        </span>

      </div>

    </article>
  `;
}

/* -------------------------------------------------
   RENDER
------------------------------------------------- */

function render(postsToShow = allPosts) {
  const posts = postsToShow || [];

  const postCount = document.getElementById("postCount");
  if (postCount) {
    postCount.textContent = `${posts.length} POSTS`;
  }

  const featured = document.getElementById("featured");
  const postGrid = document.getElementById("postGrid");
  const categoryGrid = document.getElementById("categoryGrid");

  /*
    IMPORTANT:
    Featured area and normal story grid now use the SAME card.
    Latest story goes first.
  */

  if (featured) {
    featured.innerHTML = "";
  }

  if (postGrid) {
    if (!posts.length) {
      postGrid.innerHTML = `
        <div class="empty-posts">
          <p>अभी कोई published story नहीं है.</p>
        </div>
      `;
    } else {
      postGrid.innerHTML = posts.map(createStoryCard).join("");
    }
  }

  /* Categories */

  if (categoryGrid) {
    const categories = [
      ...new Set(posts.map((post) => post.category).filter(Boolean)),
    ];

    categoryGrid.innerHTML = categories
      .map((category) => {
        const count = posts.filter(
          (post) => post.category === category
        ).length;

        return `
          <a
            class="cat-card"
            href="#stories"
            data-category="${escapeHtml(category)}"
          >
            <b>${escapeHtml(category)}</b>
            <span>${count} STORIES ↗</span>
          </a>
        `;
      })
      .join("");
  }

  attachStoryListeners();
}

/* -------------------------------------------------
   STORY CLICK
------------------------------------------------- */

function attachStoryListeners() {
  document.querySelectorAll("[data-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      /*
        Prevent accidentally triggering links/buttons inside
        a card more than once.
      */
      if (event.target.closest("a, button")) {
        return;
      }

      openReader(element.dataset.id);
    });
  });

  document.querySelectorAll("[data-category]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();

      const category = element.dataset.category;
      filterCat(category);
    });
  });
}

/* -------------------------------------------------
   CATEGORY FILTER
------------------------------------------------- */

function filterCat(category) {
  const filtered = allPosts.filter(
    (post) => post.category === category
  );

  const postGrid = document.getElementById("postGrid");

  if (postGrid) {
    postGrid.innerHTML = filtered.length
      ? filtered.map(createStoryCard).join("")
      : `
        <div class="empty-posts">
          <p>इस category में अभी कोई story नहीं है.</p>
        </div>
      `;
  }

  attachStoryListeners();

  document
    .getElementById("stories")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
}

/* -------------------------------------------------
   READER
------------------------------------------------- */

const dlg = document.getElementById("reader");

function openReader(id) {
  current = allPosts.find((post) => post.id === id);

  if (!current) {
    return;
  }

  const readerCategory = document.getElementById("readerCategory");
  const readerDate = document.getElementById("readerDate");
  const readerTitle = document.getElementById("readerTitle");
  const readerSubtitle = document.getElementById("readerSubtitle");
  const readerImage = document.getElementById("readerImage");
  const readerBody = document.getElementById("readerBody");

  if (readerCategory) {
    readerCategory.textContent = current.category || "";
  }

  if (readerDate) {
    readerDate.textContent = current.date || "";
  }

  if (readerTitle) {
    readerTitle.textContent = current.title || "";
  }

  if (readerSubtitle) {
    readerSubtitle.textContent = current.subtitle || "";
  }

  if (readerImage) {
    readerImage.src = current.image || "";
    readerImage.alt = current.title || "";
  }

  if (readerBody) {
    readerBody.textContent = current.content || "";
  }

  loadVoices();

  if (dlg?.showModal) {
    dlg.showModal();
  }

  document.body.style.overflow = "hidden";
}

/* -------------------------------------------------
   CLOSE READER
------------------------------------------------- */

const closeReader = document.getElementById("closeReader");

if (closeReader) {
  closeReader.onclick = () => {
    speechSynthesis.cancel();

    if (dlg?.open) {
      dlg.close();
    }

    document.body.style.overflow = "";
  };
}

/* -------------------------------------------------
   VOICES
------------------------------------------------- */

function loadVoices() {
  const langSelect = document.getElementById("langSelect");
  const voiceSelect = document.getElementById("voiceSelect");

  if (!langSelect || !voiceSelect) {
    return;
  }

  const language = langSelect.value;
  const voices = speechSynthesis.getVoices();

  const wanted = language === "hi" ? "hi-IN" : "en-IN";

  let filtered = voices.filter(
    (voice) =>
      voice.lang === wanted ||
      voice.lang.toLowerCase().startsWith(language + "-in")
  );

  if (!filtered.length) {
    filtered = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(language)
    );
  }

  voiceSelect.innerHTML = "";

  if (!filtered.length) {
    voiceSelect.innerHTML =
      '<option value="">इस browser में voice उपलब्ध नहीं है</option>';
    return;
  }

  filtered.forEach((voice) => {
    const option = document.createElement("option");

    option.value = voice.name;
    option.textContent = `${voice.name} — ${voice.lang}`;

    voiceSelect.appendChild(option);
  });
}

speechSynthesis.onvoiceschanged = loadVoices;

const langSelect = document.getElementById("langSelect");

if (langSelect) {
  langSelect.onchange = loadVoices;
}

/* -------------------------------------------------
   SPEED
------------------------------------------------- */

document.querySelectorAll(".speed button").forEach((button) => {
  button.onclick = () => {
    rate = Number(button.dataset.rate) || 1;

    document
      .querySelectorAll(".speed button")
      .forEach((item) => item.classList.remove("active"));

    button.classList.add("active");
  };
});
/* -------------------------------------------------
   SPEAK - ROBUST FOR ALL STORIES / NEWS
------------------------------------------------- */

let speechChunks = [];
let speechIndex = 0;
let speechStopped = false;

function splitTextForSpeech(text, maxLength = 900) {
  if (!text) return [];

  const cleanText = String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();

  if (!cleanText) return [];

  const sentences = cleanText.match(
    /[^।!?！？\n]+[।!?！？]?|\n+/g
  ) || [cleanText];

  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const part = sentence.trim();

    if (!part) continue;

    if (
      (currentChunk + " " + part).trim().length <= maxLength
    ) {
      currentChunk = (currentChunk + " " + part).trim();
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // Agar ek single sentence hi bahut lamba ho
      if (part.length > maxLength) {
        for (let i = 0; i < part.length; i += maxLength) {
          chunks.push(part.slice(i, i + maxLength));
        }

        currentChunk = "";
      } else {
        currentChunk = part;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}


function getSelectedVoice(language) {
  const voiceSelect = document.getElementById("voiceSelect");
  const voices = speechSynthesis.getVoices();

  const selectedVoiceName = voiceSelect?.value || "";

  // User ne manually voice select ki hai
  const selectedVoice = voices.find(
    (voice) => voice.name === selectedVoiceName
  );

  if (selectedVoice) {
    return selectedVoice;
  }

  // Hindi
  if (language === "hi") {
    return (
      voices.find(
        (voice) =>
          voice.lang === "hi-IN"
      ) ||
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith("hi")
      ) ||
      null
    );
  }

  // English India
  return (
    voices.find(
      (voice) =>
        voice.lang === "en-IN"
    ) ||
    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("en")
    ) ||
    null
  );
}


function speakNextChunk() {
  if (
    speechStopped ||
    speechIndex >= speechChunks.length
  ) {
    speechSynthesis.cancel();

    speakBtn.innerHTML = "▶ <span>सुनिए</span>";

    if (speakStatus) {
      speakStatus.textContent =
        "कहानी पूरी हो गई";
    }

    speechChunks = [];
    speechIndex = 0;

    return;
  }

  const selectedLanguage =
    document.getElementById("langSelect")?.value || "hi";

  const utterance =
    new SpeechSynthesisUtterance(
      speechChunks[speechIndex]
    );

  utterance.lang =
    selectedLanguage === "hi"
      ? "hi-IN"
      : "en-IN";

  utterance.voice =
    getSelectedVoice(selectedLanguage);

  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    speakBtn.innerHTML =
      "■ <span>रोकें</span>";

    if (speakStatus) {
      speakStatus.textContent =
        `पढ़कर सुनाया जा रहा है… ${
          speechIndex + 1
        } / ${speechChunks.length}`;
    }
  };

  utterance.onend = () => {
    speechIndex++;

    // Browser ko next chunk ke liye breathing space
    setTimeout(() => {
      if (!speechStopped) {
        speakNextChunk();
      }
    }, 80);
  };

  utterance.onerror = (event) => {
    console.error(
      "Speech error:",
      event
    );

    // Kabhi browser ek chunk par error de
    // to next chunk continue kar do
    speechIndex++;

    setTimeout(() => {
      if (!speechStopped) {
        speakNextChunk();
      }
    }, 120);
  };

  speechSynthesis.speak(utterance);
}


if (speakBtn) {
  speakBtn.onclick = () => {

    // Agar already bol raha hai -> STOP
    if (speechSynthesis.speaking) {

      speechStopped = true;

      speechSynthesis.cancel();

      speechChunks = [];
      speechIndex = 0;

      speakBtn.innerHTML =
        "▶ <span>सुनिए</span>";

      if (speakStatus) {
        speakStatus.textContent =
          "रुक गया";
      }

      return;
    }

    if (!current) {
      if (speakStatus) {
        speakStatus.textContent =
          "पहले कोई कहानी खोलें";
      }

      return;
    }

    const text =
      current.content || "";

    if (!text.trim()) {
      if (speakStatus) {
        speakStatus.textContent =
          "इस कहानी में content नहीं है";
      }

      return;
    }

    const selectedLanguage =
      document.getElementById("langSelect")?.value || "hi";

    speechStopped = false;

    speechChunks =
      splitTextForSpeech(
        text,
        900
      );

    speechIndex = 0;

    speechSynthesis.cancel();

    // Browser voices kabhi asynchronously load hote hain
    setTimeout(() => {
      if (!speechStopped) {
        speakNextChunk();
      }
    }, 150);
  };
}
/* -------------------------------------------------
   INITIAL LOAD
------------------------------------------------- */

loadPosts();