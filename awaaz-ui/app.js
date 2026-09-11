import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { db } from "./firebase.js";


/* =========================================================
   FALLBACK DEMO DATA
========================================================= */

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
      "शाम धीरे-धीरे शहर पर उतर रही थी। खिड़की के शीशे पर बारिश की आखिरी बूंदें अब भी अपना रास्ता खोज रही थीं।\n\nसड़क पर लोग जल्दी में थे, लेकिन कमरे के भीतर समय कुछ धीमा पड़ गया था। उसने चाय का कप उठाया और सामने की खाली कुर्सी को देखा। कुछ लोग चले जाते हैं, पर उनकी कही हुई बातें कमरे में रह जाती हैं।\n\nउस शाम उसे पहली बार लगा कि यादें भी आवाज़ रखती हैं—बस उन्हें सुनने के लिए थोड़ी खामोशी चाहिए।"
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
      "हर सुबह शहर अपने साथ नई खबरें लेकर आता है। इस पोस्ट में हम जरूरी घटनाओं को सरल भाषा में समझते हैं, ताकि सूचना शोर न बने।\n\nकिसी भी खबर को साझा करने से पहले उसके स्रोत और तारीख को देखना जरूरी है। यहाँ प्रकाशित सामग्री को संपादकीय टीम द्वारा पढ़कर और व्यवस्थित करके प्रस्तुत किया जाता है।"
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
      "हम हर दिन सैकड़ों शब्द देखते हैं, लेकिन कितने शब्द सच में पढ़ते हैं?\n\nधीरे पढ़ना किसी पुराने समय में लौटना नहीं है। यह बस इतना है कि जब कोई विचार सामने आए तो उसे कुछ पल दिए जाएँ। एक पैराग्राफ पूरा करें, साँस लें और फिर आगे बढ़ें।\n\nAwaaz इसी छोटे से ठहराव की जगह बनना चाहता है।"
  }
];


let allPosts = [];
let current = null;
let rate = 1;


/* =========================================================
   HELPERS
========================================================= */

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
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
      year: "numeric"
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

    return Number.isNaN(time)
      ? 0
      : time;
  }

  return 0;
}


/* =========================================================
   FIRESTORE LOAD
========================================================= */

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
          date: formatDate(data.createdAt)
        };
      })
      .sort(
        (a, b) =>
          getSortTime(b) -
          getSortTime(a)
      );

    console.info(
      `Awaaz: ${allPosts.length} published post(s) loaded.`
    );

  } catch (error) {

    console.error(
      "Firestore load failed:",
      error
    );

    allPosts = [...fallbackDemo].sort(
      (a, b) =>
        getSortTime(b) -
        getSortTime(a)
    );
  }

  render();
}


/* =========================================================
   GENERIC STORY CARD
========================================================= */

function createStoryCard(post) {
  return `
    <article
      class="post reveal"
      data-id="${escapeHtml(post.id)}"
    >

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
          ${
            post.date
              ? ` — ${escapeHtml(post.date)}`
              : ""
          }
        </span>


        <h3>
          ${escapeHtml(post.title || "")}
        </h3>


        ${
          post.subtitle
            ? `
              <p>
                ${escapeHtml(post.subtitle)}
              </p>
            `
            : ""
        }


        <span class="post-read">
          पढ़ें / सुनें ↗
        </span>

      </div>

    </article>
  `;
}


/* =========================================================
   NEWS DETECTION
========================================================= */

function isNewsPost(post) {

  const category =
    String(
      post?.category || ""
    )
      .trim()
      .toLowerCase();


  return (
    category === "खबर" ||
    category === "news" ||
    category.includes("news")
  );
}


/* =========================================================
   NEWS SECTION
========================================================= */

function renderNews(posts) {

  const newsPosts = (posts || [])
    .filter(isNewsPost)
    .sort(
      (a, b) =>
        getSortTime(b) -
        getSortTime(a)
    );


  const newsCount =
    document.getElementById(
      "newsCount"
    );

  const newsSide =
    document.getElementById(
      "newsSide"
    );

  const newsBriefList =
    document.getElementById(
      "newsBriefList"
    );

  const mainTitle =
    document.getElementById(
      "newsMainTitle"
    );

  const mainSubtitle =
    document.getElementById(
      "newsMainSubtitle"
    );

  const mainImage =
    document.getElementById(
      "newsMainImage"
    );

  const mainCategory =
    document.getElementById(
      "newsMainCategory"
    );

  const mainDate =
    document.getElementById(
      "newsMainDate"
    );

  const readButton =
    document.getElementById(
      "newsReadButton"
    );


  if (
    !newsCount ||
    !newsSide ||
    !newsBriefList
  ) {
    return;
  }


  newsCount.textContent =
    `${newsPosts.length} NEWS`;


  /* -----------------------------------------
     No News Yet
  ----------------------------------------- */

  if (!newsPosts.length) {

    newsSide.innerHTML = `
      <article class="news-side-empty">

        <span class="section-tag">
          NEWS
        </span>

        <h3>
          अभी कोई प्रकाशित खबर नहीं है।
        </h3>

        <p>
          Admin Studio से category
          <b>खबर</b> के साथ published post जोड़ें।
        </p>

      </article>
    `;


    newsBriefList.innerHTML = `
      <li>
        अभी कोई published news नहीं है।
      </li>
    `;


    if (mainTitle) {
      mainTitle.textContent =
        "आज की खबरें";
    }


    if (mainSubtitle) {
      mainSubtitle.textContent =
        "जैसे ही नई खबर publish होगी, वह यहाँ दिखाई देगी।";
    }


    if (mainImage) {
      mainImage.src =
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1800&q=85";

      mainImage.alt =
        "Awaaz news";
    }


    if (mainCategory) {
      mainCategory.textContent =
        "खबर";
    }


    if (mainDate) {
      mainDate.textContent =
        "";
    }


    if (readButton) {
      readButton.onclick = null;
    }


    return;
  }


  /* -----------------------------------------
     Featured News
  ----------------------------------------- */

  const main =
    newsPosts[0];


  if (mainCategory) {
    mainCategory.textContent =
      main.category || "खबर";
  }


  if (mainDate) {
    mainDate.textContent =
      main.date || "";
  }


  if (mainTitle) {
    mainTitle.textContent =
      main.title || "";
  }


  if (mainSubtitle) {
    mainSubtitle.textContent =
      main.subtitle || "";
  }


  if (mainImage) {

    mainImage.src =
      main.image || "";

    mainImage.alt =
      main.title || "";
  }


  if (readButton) {

    readButton.onclick =
      () => openReader(main.id);
  }


  /* -----------------------------------------
     Left News List
  ----------------------------------------- */

  const sidePosts =
    newsPosts.slice(1, 6);


  newsSide.innerHTML =
    sidePosts.length

      ? sidePosts
          .map(
            (post) => `
              <article
                class="side-story news-side-story"
                data-news-id="${escapeHtml(post.id)}"
              >

                <span class="section-tag">
                  ${escapeHtml(
                    post.category ||
                      "खबर"
                  )}
                </span>

                <h3>
                  ${escapeHtml(
                    post.title ||
                      ""
                  )}
                </h3>

                ${
                  post.subtitle
                    ? `
                      <p>
                        ${escapeHtml(
                          post.subtitle
                        )}
                      </p>
                    `
                    : ""
                }

              </article>
            `
          )
          .join("")

      : `
          <article class="news-side-empty">

            <span class="section-tag">
              NEWS
            </span>

            <h3>
              यहाँ अगली खबरें दिखेंगी।
            </h3>

            <p>
              नई published खबरें
              Admin Studio से अपने आप जुड़ेंगी।
            </p>

          </article>
        `;


  /* -----------------------------------------
     Briefing List
  ----------------------------------------- */

  newsBriefList.innerHTML =
    newsPosts
      .slice(0, 5)
      .map(
        (post) => `
          <li
            data-news-id="${escapeHtml(post.id)}"
          >
            ${escapeHtml(
              post.title || ""
            )}
          </li>
        `
      )
      .join("");


  /* -----------------------------------------
     News Clicks
  ----------------------------------------- */

  newsSide
    .querySelectorAll(
      "[data-news-id]"
    )
    .forEach((el) => {

      el.addEventListener(
        "click",
        () =>
          openReader(
            el.dataset.newsId
          )
      );

    });


  newsBriefList
    .querySelectorAll(
      "[data-news-id]"
    )
    .forEach((el) => {

      el.addEventListener(
        "click",
        () =>
          openReader(
            el.dataset.newsId
          )
      );

    });
}


/* =========================================================
   MAIN RENDER
========================================================= */

function render() {

  const posts =
    allPosts || [];


  /* -----------------------------------------
     Post Count
  ----------------------------------------- */

  const postCount =
    document.getElementById(
      "postCount"
    );

  if (postCount) {
    postCount.textContent =
      `${posts.length} POSTS`;
  }


  /* -----------------------------------------
     Existing Sections
  ----------------------------------------- */

  const featured =
    document.getElementById(
      "featured"
    );

  const postGrid =
    document.getElementById(
      "postGrid"
    );

  const categoryGrid =
    document.getElementById(
      "categoryGrid"
    );


  /* -----------------------------------------
     Render News
  ----------------------------------------- */

  renderNews(posts);


  /* -----------------------------------------
     FEATURED STORY
  ----------------------------------------- */

  const featuredPost =
    posts[0];


  if (featured) {

    if (!featuredPost) {

      featured.innerHTML = `
        <div class="feature empty-feature">

          <div class="feature-copy">

            <p>
              अभी कोई published story नहीं है।
            </p>

          </div>

        </div>
      `;

    } else {

      featured.innerHTML = `
        <article
          class="feature reveal"
          data-id="${escapeHtml(
            featuredPost.id
          )}"
        >


          <div class="feature-img">

            <img
              src="${escapeHtml(
                featuredPost.image ||
                  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=85"
              )}"
              alt="${escapeHtml(
                featuredPost.title ||
                  ""
              )}"
              loading="lazy"
            >

          </div>


          <div class="feature-copy">

            <div>

              <span class="feature-cat">

                ${escapeHtml(
                  featuredPost.category ||
                    "कहानी"
                )}

                ${
                  featuredPost.date
                    ? ` — ${escapeHtml(
                        featuredPost.date
                      )}`
                    : ""
                }

              </span>


              <h3>

                ${escapeHtml(
                  featuredPost.title ||
                    ""
                )}

              </h3>


              ${
                featuredPost.subtitle
                  ? `
                    <p>
                      ${escapeHtml(
                        featuredPost.subtitle
                      )}
                    </p>
                  `
                  : ""
              }

            </div>


            <a class="read-link">
              READ / LISTEN ↗
            </a>

          </div>

        </article>
      `;
    }
  }


  /* -----------------------------------------
     ALL STORIES
  ----------------------------------------- */

 /* -----------------------------------------
   STORIES ONLY
   News ko Stories section se alag rakho
----------------------------------------- */

const storyPosts = posts.filter(
  (post) => !isNewsPost(post)
);

if (postGrid) {

  if (!storyPosts.length) {

    postGrid.innerHTML = `
      <div class="empty-posts">
        <p>
          अभी कोई published story नहीं है।
        </p>
      </div>
    `;

  } else {

    postGrid.innerHTML =
      storyPosts
        .map(
          (post) =>
            createStoryCard(post)
        )
        .join("");
  }
}

  /* -----------------------------------------
     CATEGORY CARDS
  ----------------------------------------- */

  if (categoryGrid) {

    const categories = [
      ...new Set(
        posts
          .map(
            (post) =>
              post.category
          )
          .filter(Boolean)
      )
    ];


    categoryGrid.innerHTML =
      categories
        .map((category) => {

          const count =
            posts.filter(
              (post) =>
                post.category ===
                category
            ).length;


          return `
            <a
              class="cat-card"
              href="#stories"
              data-category="${escapeHtml(
                category
              )}"
            >

              <b>
                ${escapeHtml(
                  category
                )}
              </b>

              <span>
                ${count} STORIES ↗
              </span>

            </a>
          `;

        })
        .join("");
  }


  /* -----------------------------------------
     STORY CLICKS
  ----------------------------------------- */

  document
    .querySelectorAll(
      "[data-id]"
    )
    .forEach((el) => {

      el.addEventListener(
        "click",
        (event) => {

          if (
            event.target.closest(
              "a, button"
            )
          ) {
            return;
          }


          openReader(
            el.dataset.id
          );

        }
      );

    });


  /* -----------------------------------------
     CATEGORY FILTER
  ----------------------------------------- */

  document
    .querySelectorAll(
      "[data-category]"
    )
    .forEach((el) => {

      el.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          filterCat(
            el.dataset.category
          );

        }
      );

    });
}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function filterCat(category) {

  const filtered =
    allPosts.filter(
      (post) =>
        post.category ===
        category
    );


  const postGrid =
    document.getElementById(
      "postGrid"
    );


  if (postGrid) {

    postGrid.innerHTML =
      filtered.length

        ? filtered
            .map(
              (post) =>
                createStoryCard(post)
            )
            .join("")

        : `
          <div class="empty-posts">

            <p>
              इस category में अभी कोई story नहीं है।
            </p>

          </div>
        `;
  }


  document
    .querySelectorAll(
      "[data-id]"
    )
    .forEach((el) => {

      el.addEventListener(
        "click",
        (event) => {

          if (
            event.target.closest(
              "a, button"
            )
          ) {
            return;
          }

          openReader(
            el.dataset.id
          );
        }
      );

    });


  document
    .getElementById(
      "stories"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}


/* =========================================================
   READER
========================================================= */

const dlg =
  document.getElementById(
    "reader"
  );


function openReader(id) {

  current =
    allPosts.find(
      (post) =>
        post.id === id
    );


  if (!current) {
    return;
  }


  const readerCategory =
    document.getElementById(
      "readerCategory"
    );

  const readerDate =
    document.getElementById(
      "readerDate"
    );

  const readerTitle =
    document.getElementById(
      "readerTitle"
    );

  const readerSubtitle =
    document.getElementById(
      "readerSubtitle"
    );

  const readerImage =
    document.getElementById(
      "readerImage"
    );

  const readerBody =
    document.getElementById(
      "readerBody"
    );


  if (readerCategory) {
    readerCategory.textContent =
      current.category ||
      "";
  }


  if (readerDate) {
    readerDate.textContent =
      current.date ||
      "";
  }


  if (readerTitle) {
    readerTitle.textContent =
      current.title ||
      "";
  }


  if (readerSubtitle) {
    readerSubtitle.textContent =
      current.subtitle ||
      "";
  }


  if (readerImage) {

    readerImage.src =
      current.image ||
      "";

    readerImage.alt =
      current.title ||
      "";
  }


  if (readerBody) {

    readerBody.textContent =
      current.content ||
      "";
  }


  loadVoices();


  if (dlg?.showModal) {
    dlg.showModal();
  }


  document.body.style.overflow =
    "hidden";
}


/* =========================================================
   CLOSE READER
========================================================= */

const closeReader =
  document.getElementById(
    "closeReader"
  );


if (closeReader) {

  closeReader.onclick =
    () => {

      speechSynthesis.cancel();


      if (dlg?.open) {
        dlg.close();
      }


      document.body.style.overflow =
        "";
    };
}


/* =========================================================
   VOICES
========================================================= */

function loadVoices() {

  const langSelect =
    document.getElementById(
      "langSelect"
    );

  const voiceSelect =
    document.getElementById(
      "voiceSelect"
    );


  if (
    !langSelect ||
    !voiceSelect
  ) {
    return;
  }


  const language =
    langSelect.value;


  const voices =
    speechSynthesis.getVoices();


  const wanted =
    language === "hi"
      ? "hi-IN"
      : "en-IN";


  let filtered =
    voices.filter(
      (voice) =>
        voice.lang === wanted ||
        voice.lang
          .toLowerCase()
          .startsWith(
            language + "-in"
          )
    );


  if (!filtered.length) {

    filtered =
      voices.filter(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              language
            )
      );
  }


  voiceSelect.innerHTML =
    "";


  if (!filtered.length) {

    voiceSelect.innerHTML =
      `
        <option value="">
          इस browser में voice उपलब्ध नहीं है
        </option>
      `;

    return;
  }


  filtered.forEach(
    (voice) => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        voice.name;


      option.textContent =
        `${voice.name} — ${voice.lang}`;


      voiceSelect.appendChild(
        option
      );
    }
  );
}


speechSynthesis.onvoiceschanged =
  loadVoices;


const langSelect =
  document.getElementById(
    "langSelect"
  );


if (langSelect) {

  langSelect.onchange =
    loadVoices;
}


/* =========================================================
   SPEED
========================================================= */

document
  .querySelectorAll(
    ".speed button"
  )
  .forEach((button) => {

    button.onclick =
      () => {

        rate =
          Number(
            button.dataset.rate
          ) || 1;


        document
          .querySelectorAll(
            ".speed button"
          )
          .forEach(
            (item) =>
              item.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );
      };
  });


/* =========================================================
   SPEAK
========================================================= */

let speechChunks = [];
let speechIndex = 0;
let speechStopped = false;


function splitTextForSpeech(
  text,
  maxLength = 900
) {

  if (!text) {
    return [];
  }


  const cleanText =
    String(text)
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\n+/g,
        "\n"
      )
      .trim();


  if (!cleanText) {
    return [];
  }


  const sentences =
    cleanText.match(
      /[^।!?！？\n]+[।!?！？]?|\n+/g
    ) || [cleanText];


  const chunks = [];

  let currentChunk =
    "";


  for (
    const sentence of sentences
  ) {

    const part =
      sentence.trim();


    if (!part) {
      continue;
    }


    if (
      (
        currentChunk +
        " " +
        part
      )
        .trim()
        .length <=
      maxLength
    ) {

      currentChunk =
        (
          currentChunk +
          " " +
          part
        ).trim();

    } else {

      if (currentChunk) {
        chunks.push(
          currentChunk
        );
      }


      if (
        part.length >
        maxLength
      ) {

        for (
          let i = 0;
          i < part.length;
          i += maxLength
        ) {

          chunks.push(
            part.slice(
              i,
              i + maxLength
            )
          );
        }


        currentChunk =
          "";

      } else {

        currentChunk =
          part;
      }
    }
  }


  if (currentChunk) {
    chunks.push(
      currentChunk
    );
  }


  return chunks;
}


function getSelectedVoice(
  language
) {

  const voiceSelect =
    document.getElementById(
      "voiceSelect"
    );


  const voices =
    speechSynthesis.getVoices();


  const selectedVoiceName =
    voiceSelect?.value ||
    "";


  const selectedVoice =
    voices.find(
      (voice) =>
        voice.name ===
        selectedVoiceName
    );


  if (selectedVoice) {
    return selectedVoice;
  }


  if (language === "hi") {

    return (
      voices.find(
        (voice) =>
          voice.lang ===
          "hi-IN"
      ) ||

      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              "hi"
            )
      ) ||

      null
    );
  }


  return (
    voices.find(
      (voice) =>
        voice.lang ===
        "en-IN"
    ) ||

    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(
            "en"
          )
    ) ||

    null
  );
}


function speakNextChunk() {

  if (
    speechStopped ||
    speechIndex >=
      speechChunks.length
  ) {

    speechSynthesis.cancel();


    if (speakBtn) {
      speakBtn.innerHTML =
        "▶ <span>सुनिए</span>";
    }


    if (speakStatus) {

      speakStatus.textContent =
        "कहानी पूरी हो गई";
    }


    speechChunks = [];
    speechIndex = 0;


    return;
  }


  const selectedLanguage =
    document.getElementById(
      "langSelect"
    )?.value ||
    "hi";


  const utterance =
    new SpeechSynthesisUtterance(
      speechChunks[
        speechIndex
      ]
    );


  utterance.lang =
    selectedLanguage === "hi"
      ? "hi-IN"
      : "en-IN";


  utterance.voice =
    getSelectedVoice(
      selectedLanguage
    );


  utterance.rate =
    rate;

  utterance.pitch =
    1;

  utterance.volume =
    1;


  utterance.onstart =
    () => {

      if (speakBtn) {
        speakBtn.innerHTML =
          "■ <span>रोकें</span>";
      }


      if (speakStatus) {

        speakStatus.textContent =
          `पढ़कर सुनाया जा रहा है… ${
            speechIndex + 1
          } / ${
            speechChunks.length
          }`;
      }
    };


  utterance.onend =
    () => {

      speechIndex++;


      setTimeout(
        () => {

          if (!speechStopped) {
            speakNextChunk();
          }

        },
        80
      );
    };


  utterance.onerror =
    (event) => {

      console.error(
        "Speech error:",
        event
      );


      speechIndex++;


      setTimeout(
        () => {

          if (!speechStopped) {
            speakNextChunk();
          }

        },
        120
      );
    };


  speechSynthesis.speak(
    utterance
  );
}


const speakBtn =
  document.getElementById(
    "speakBtn"
  );

const speakStatus =
  document.getElementById(
    "speakStatus"
  );

const voiceSelect =
  document.getElementById(
    "voiceSelect"
  );


if (speakBtn) {

  speakBtn.onclick =
    () => {

      /* STOP */

      if (
        speechSynthesis.speaking
      ) {

        speechStopped =
          true;


        speechSynthesis.cancel();


        speechChunks =
          [];

        speechIndex =
          0;


        speakBtn.innerHTML =
          "▶ <span>सुनिए</span>";


        if (speakStatus) {

          speakStatus.textContent =
            "रुक गया";
        }


        return;
      }


      /* NO CURRENT STORY */

      if (!current) {

        if (speakStatus) {

          speakStatus.textContent =
            "पहले कोई कहानी खोलें";
        }

        return;
      }


      const text =
        current.content ||
        "";


      if (!text.trim()) {

        if (speakStatus) {

          speakStatus.textContent =
            "इस कहानी में content नहीं है";
        }

        return;
      }


      const selectedLanguage =
        document.getElementById(
          "langSelect"
        )?.value ||
        "hi";


      speechStopped =
        false;


      speechChunks =
        splitTextForSpeech(
          text,
          900
        );


      speechIndex =
        0;


      speechSynthesis.cancel();


      setTimeout(
        () => {

          if (!speechStopped) {
            speakNextChunk();
          }

        },
        150
      );
    };
}


/* =========================================================
   INITIAL LOAD
========================================================= */

loadPosts();