import axios from "../plugins/axios";

export async function getImages() {
  return new Promise((resolve, reject) => {
    axios.get("/api/images")
      .then(resp => {
        resolve(resp.data);
      })
      .catch(err => reject(err));
  });
}

export async function getResult(data) {
  return new Promise((resolve, reject) => {
    axios.post("/api/rundemo", data)
      .then(resp => {
        resolve(resp.data);
      })
      .catch(err => reject(err));
  });
}
