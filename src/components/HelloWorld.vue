<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-form
          class="mb-4"
          ref="form"
          v-model="valid"
          lazy-validation
        >
          <v-row>
            <v-col>
              <v-file-input
                  show-size
                  :rules="[ this.uploadImageExistRule, this.uploadImageRule ]"
                  accept="image/*"
                  v-model="file"
                  label="上传图片 Upload image file"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-select
                v-model="image"
                :items="images"
                :rules="[ this.selectImageRule ]"
                label="图片 Image"
                clearable
              />
            </v-col>
            <v-col>
              <v-select
                v-model="model"
                :items="models"
                :rules="[v => !!v || '请选择攻击的模型']"
                label="模型 Model"
                required
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                v-model="target"
                :rules="[v => !!v || '请输入攻击的目标文字']"
                label="目标文字 Target"
                required
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="groundTruth"
                :rules="[v => !!v || '请输入图片的实际文字']"
                label="实际文字 Ground Truth"
                required
              />
            </v-col>
          </v-row>
          <v-btn
            :disabled="waiting"
            color="success"
            @click="validate"
            width="100%"
          >导入模型 Load Model</v-btn>
        </v-form>
        <div class="my-4" v-show="waiting">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <span class="text--secondary pl-2">导入模型中 Loading Model...</span>
        </div>
        <v-dialog
          v-model="showResultDialog"
          width="75%"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :disabled="!isResult"
              color="red lighten-2"
              dark
              v-bind="attrs"
              v-on="on"
              width="100%"
            >训练 Train</v-btn>
          </template>

          <template v-if="showResultDialog">
            <v-card>
              <v-card-title>结果 Result</v-card-title>
              <v-card-text>Successful Rate: {{result.sr.toFixed(2)}}%</v-card-text>
              <v-card-text>Averaged L2 Distance: {{result.averDist.toFixed(2)}}</v-card-text>
              <v-card-text>Averaged Number of Iterations: {{result.averIter.toFixed(2)}}</v-card-text>
              <v-card-text>
              <v-row
                width="80%"
                class="d-flex justify-center"
              >
                <v-col style="max-width: 50%;">
                  <img
                    :src="'data:image/png;base64,' + result.image"
                    width="80%"
                    @click="openInNewTab"
                  />
                </v-col>
              </v-row>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  text
                  @click="showResultDialog = false"
                >
                  关闭 Close
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
          

      </v-col>
    </v-row>
    <v-snackbar
      v-model="showMessage"
      :timeout="timeout"
    >{{errorMessage}}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="blue"
          text
          v-bind="attrs"
          @click="showMessage = false"
        >
          关闭 Close
        </v-btn>
      </template>
    </v-snackbar>

  </v-container>
</template>

<script>
import { getImages, getResult } from "../utils/api";
// import { TEST_RESULT } from "../utils/config";

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export default {
  name: 'HelloWorld',

  data: () => ({
    file: null,
    waiting: false,
    isResult: false,
    valid: false,
    showResultDialog: false,
    showMessage: false, // error message display
    model: '',
    timeout: 5000,
    image: '',
    images: [],
    models: [
      'TPS-ResNet-BiLSTM-Attn.pth',
      'TPS-ResNet-BiLSTM-CTC.pth'
    ],
    target: '',
    groundTruth: '',
    result: {},
    errorMessage: '',
  }),
  methods: {
    validate () {
      if (this.$refs.form.validate()) {
        this.waiting = true;
        this.isResult = false;
        const solveResponse = resp => {
          this.waiting = false;
          this.isResult = true;
          console.log(resp);
          this.result = resp;
        };
        const solveError = err => {
          this.waiting = false;
          let resp = err.response;
          if (!resp) {
            this.errorMessage = "导入模型超时";
            this.showMessage = true;
            return;
          }
          console.log('request failed', resp);
          if (resp.status == 502) {
            this.errorMessage = "服务端未启动或无法连接服务端";
            this.showMessage = true;
            return;
          }
          if (resp.status == 500) {
            this.errorMessage = "服务端错误或实际文字与图片不符";
            this.showMessage = true;
            return;
          }
          this.errorMessage = resp.statusText;
          this.showMessage = true;
        };
        if (this.file) {
          toBase64(this.file)
            .then(resp => {
              getResult({
                model: this.model,
                imageFile: resp.slice(resp.indexOf(',') + 1),
                target: this.target,
                groundTruth: this.groundTruth,
              }).then(solveResponse).catch(solveError);
            });
        } else {
          getResult({
            model: this.model,
            image: this.image,
            target: this.target,
            groundTruth: this.groundTruth,
          }).then(solveResponse).catch(solveError);
        }
        /*
        this.result = TEST_RESULT;
        this.waiting = false;
        this.isResult = true;
        */
      }
    },
    selectImageRule(v) {
      return (
        !!this.file || !!v || '请选择图片'
      );
    },
    uploadImageExistRule(v) {
      return (
        !!this.image || !!v || '请选择上传的图片'
      );
    },
    uploadImageRule(v) {
      return (
        !!this.image || !v || v.size < 400000 || '图片大小应小于 400kB'
      );
    },
    openInNewTab() {
      let image = new Image();
      image.src = 'data:image/png;base64,' + this.result.image;
      image.style = 'width: 80%;';
      let w = window.open('');
      w.document.write(image.outerHTML);
      w.document.close();
    }
  },
  created() {
    getImages().then(resp => {
      this.images = resp;
    });
  }
}
</script>
