const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios").default;
const utils = require("./utils");
const { UserModel } = require("./mongoose");

const { USER_NAME, PASSWORD, USER_ID } = process.env;

// axios.defaults.baseURL = "https://i.instagram.com/api/v1"
class InstagramBot {
  // _selectorDialog = 'div[role="dialog"] ._aano';
  initialize = async () => {
    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
    );

    await this.setUpInterceptor();
  };

  setUpInterceptor = async () => {
    await this.page.setRequestInterception(true);
    this.page.on("request", (request) => {
      if (["image"].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await this.page.on("console", (msg) => {
      for (let i = 0; i < msg._args.length; ++i) {
        msg._args[i].jsonValue().then((result) => {
          console.log(result);
        });
      }
    });
  };

  _writeCookie = async () => {
    const cookies = await this.page.cookies();
    await fs.writeFileSync("./cookies.json", JSON.stringify(cookies, null, 2));
  };

  _getCookie = () => {
    const cookiesString = fs.readFileSync("./cookies.json", "utf8");
    const cookie = JSON.parse(cookiesString);

    return cookie.map(({ name, value }) => `${name}=${value}`).join("; ");
  };

  _setCookie = async () => {
    try {
      const cookiesString = await fs.readFileSync("./cookies.json");
      if (!cookiesString) return false;
      const cookies = JSON.parse(cookiesString);
      await this.page.setCookie(...cookies);

      return true;
    } catch (e) {
      return false;
    }
  };

  _performLoginForm = async () => {
    await this.page.type(
      '[aria-label="Phone number, username, or email"]',
      USER_NAME,
      { delay: 1000 }
    );
    await this.page.type('[aria-label="Password"]', PASSWORD, {
      delay: 1000,
    });
    await this.page.click("button[type = submit]", { delay: 1000 });

    await this.page.waitFor(10000);
  };

  login = async () => {
    const URL = "https://www.instagram.com/?hl=en";
    const URL_PROFILE = `https://www.instagram.com/${USER_NAME}/?hl=en`;
    await this.page.goto(URL);
    const isHaveCookie = await this._setCookie();
    if (isHaveCookie) {
      await this.page.reload();
    }
    await this.page.waitFor(5000);
    await this.page.screenshot({ path: "./images/navigation.png" });

    const inputUserName = await this.page
      .waitForSelector('[aria-label="Phone number, username, or email"]', {
        timeout: 5000,
      })
      .catch(console.log);

    const isLogin = inputUserName;

    if (isLogin) {
      await this._performLoginForm();
    }

    await this.page.goto(URL_PROFILE);
    await this.page.waitFor(5000);
    if (isLogin) await this._writeCookie();

    await this.page.screenshot({ path: "./images/example.png" });
  };

  closeBrowser = async () => {
    await this.browser.close();
  };

  getMyProfile = async (username = USER_NAME) => {
    const res = await axios.get(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "x-ig-app-id": 936619743392459,
          Cookie: this._getCookie(),
        },
      }
    );

    const {
      edge_follow,
      edge_followed_by,
      edge_owner_to_timeline_media,
      followed_by_viewer,
    } = res.data.data.user;

    return {
      followers: edge_followed_by.count,
      following: edge_follow.count,
      mediaShortCode: edge_owner_to_timeline_media.edges
        .slice(0, 3)
        .map(({ node: { shortcode } }) => shortcode),
      isFollowing: followed_by_viewer,
    };
  };

  getUsers = async (count, type) => {
    let next_max_id = null;
    let users = [];
    while (users.length < count) {
      const max_id = next_max_id ? `&max_id=${next_max_id}` : "";
      const res = await axios.get(
        `https://i.instagram.com/api/v1/friendships/${USER_ID}/${type}/?count=100&search_surface=follow_list_page${max_id}`,
        {
          headers: {
            "x-ig-app-id": 936619743392459,
            Cookie: this._getCookie(),
          },
        }
      );

      users = [...users, ...res.data.users];
      console.log(users.length, res.data.users.length, next_max_id);
      next_max_id = res.data.next_max_id;

      await utils.sleep(3000);
    }

    const userRes = users
      .filter((user) => !user.is_private)
      .map((user) => ({
        username: user.username,
        // type,
        is_private: user.is_private,
        userId: user.pk,
      }));

    for (let user of userRes) {
      await UserModel.findOneAndUpdate({ username: user.username }, user, {
        upsert: true,
      });
    }

    return userRes;
  };

  performComment = async (mediaShortCode) => {
    for (const code of mediaShortCode) {
      const postPage = await this.browser.newPage();
      await postPage.goto(`https://www.instagram.com/p/${code}/`);
      await postPage.waitFor(2000);
      await postPage.type("._aao9 textarea", utils.randomComment(), {
        delay: 400,
      });
    }
  };

  performBot = async () => {
    const user = await UserModel.findOne({
      $or: [
        {
          isCommented: { $ne: true },
        },
        {
          isResolvedFollower: { $ne: true },
        },
        {
          isResolvedFollowing: { $ne: true },
        },
      ],
    }).lean();
    if (!user) return;
    const { followers, following, mediaShortCode, isFollowing } =
      await this.getMyProfile(user.username);
    await this.page.goto(`https://www.instagram.com/${user.username}/`);
    await this.page.waitFor(2000);
    if (!isFollowing) {
      await this.page.click("._abn9._abng._abni._abnn", { delay: 300 });
      await this.page.waitFor(1000);
    }

    if (!user.isCommented) {
      await this.performComment(mediaShortCode);
      await UserModel.updateOne(
        {
          username: user.username,
        },
        { isCommented: true }
      );
    }

    if (!user.isResolvedFollower) {
      await this.getUsers(followers, "followers");
      await UserModel.updateOne(
        {
          username: user.username,
        },
        { isResolvedFollower: true }
      );
    }

    if (!user.isResolvedFollowing) {
      await this.getUsers(following, "following");

      await UserModel.updateOne(
        {
          username: user.username,
        },
        { isResolvedFollowing: true }
      );
    }
  };

  buildBot = async () => {
    try {
      await this.initialize();
      await this.login();
      // const { followers, following } = await this.getMyProfile();
      // await this.getUsers(followers, "followers");
      // await this.getUsers(following, "following");

      while (true) {
        await this.performBot();
      }
    } catch (e) {
      console.log(e);
    } finally {
      // await this.closeBrowser();
      console.log("finally");
    }
  };

  screenshot = async () => {
    await this.page.screenshot({ path: "./images/screenshot.png" });
  };
}

const instagram = new InstagramBot();

module.exports = instagram;
