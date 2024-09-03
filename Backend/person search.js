const axios = require("axios");
const cheerio = require("cheerio");

const searchQuery = "Darshana Perera hSenid Mobile Solution";
const url = `https://www.google.com/search?q=${encodeURIComponent(
  searchQuery
)}`;

axios
  .get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  })
  .then((response) => {
    const $ = cheerio.load(response.data);
    const results = [];

    $("h3").each((index, element) => {
      const title = $(element).text();
      const link = $(element).parent().attr("href"); // Get the URL from the parent anchor element
      results.push({ title, url: link });
    });

    console.log(results);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
