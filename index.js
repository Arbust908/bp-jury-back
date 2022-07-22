import express from "express";
import bodyParser from "body-parser";
import {FormData} from "formdata-node"
import fetch from 'node-fetch';
import 'dotenv/config'
const { CLIENT_ID, REDIRECT_URI, CLIENT_SECRET } = process.env;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.json({ type: "text/*" }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.post("/authenticate", (req, res) => {
    const { code } = req.body;
    console.log('>----<');
    const data = new FormData();
    data.append("code", code);
    data.append("client_id", CLIENT_ID);
    data.append("client_secret", CLIENT_SECRET);
    data.append("redirect_uri", REDIRECT_URI);

    fetch(`https://github.com/login/oauth/access_token`, {
        method: "POST",
        body: data,
    })
        .then((response) => {
            return response.text()
        })
        .then((paramsString) => {
            const params = new URLSearchParams(paramsString);
            const access_token = params.get("access_token");
            const fetchOptions = {
                headers: {
                    Authorization: `token ${access_token}`,
                    },
            }
            const getGHUser = fetch(`https://api.github.com/user`, fetchOptions);
            const getGHRepos = fetch(`https://api.github.com/user/repos`, fetchOptions);
            return Promise.all([getGHUser, getGHRepos]);
        })
        .then((reps) => {
            const [user, repos] = reps;
            return Promise.all([user.json(), repos.json()]);
        })
        .then((jsons) => {
            return {
                user: jsons[0],
                repos: jsons[1],
                repos_total: jsons[1].length,
                code: code,
            }
        })
        // .then((response) => response.json())
        .then((response) => {
        return res.status(200).json(response);
        })
        .catch((error) => {
        return res.status(400).json(error);
        });
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));