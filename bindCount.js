Page({
  options:{},
  data: {
    windowHeight: 0,
    count: 60,
    btnTitle: "获取验证码",
    btnEnable: true,//防止连续获取验证码
    phoneNumber: "",
    arcCode: "",
    firstNumber: '',//图形验证码4个
    secondNumber: '',
    thirdNumber: '',
    forthNumber: '',
    isShowImageCode: false,//是否显示图形验证码
    imageCodeUrl: '',
    imageCodeToken: '',//用于验证图形验证码
    isImageCodeOutTime:false,
    outDateCount:180,//图形验证码过期时间
    inputDefaltValue:'',//默认输入
    isChange : true
    
  },
  onLoad: function (options) {
    var that = this;
    this.options = wx.getStorageSync("bindData")
    // 生命周期函数--监听页面加载
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          windowHeight: res.windowHeight * 750 / res.windowWidth,
        })

      }
    })
  },

  /**
   * 验证手机号是否已经绑定
   */
  isPhoneNumberBinded:function(){
    let that = this;
    let app = getApp()

    if (this.data.phoneNumber.length < 11) {
      app.showloadingMessgage("请输入正确的手机号")
      return;
    } 
    //点一下 就不能点击
    this.setData({
      btnEnable: false
    })
    let params = {
      mobilePhone: this.data.phoneNumber,
      unionid: this.options.unionid
    }
    app.getServerce(app.data.url + "/login/is-mobilephone-wechatbind", "GET", params, (isSuccess, data) => {
      if (isSuccess) {
        if (data.data.isWechatBind == false){
          //获取验证码
          that.getArcNumber()
        }else{
          that.setData({
            btnEnable: true
          })
          wx.showModal({
            title: '',
            content: "该手机号已绑定其它微信号",
            showCancel: false
          })
        }
      } else {
        that.setData({
          btnEnable: true
        })
        app.showloadingMessgage(data)

      }

    })

  },
  /**
   * 获取验证码
   */
  getArcNumber() {
    let that = this;
   
    let app = getApp()
    app.getServerce(app.data.url + "/login/get-verification-code/", "POST", { "mobilePhone": this.data.phoneNumber }, (isSuccess, data) => {
      if (isSuccess) {        
        if (data.data.isHaveCaptcha == true){
          that.countDown180()
          this.setData({
            isShowImageCode: true,
            imageCodeUrl: app.data.url + "/common/get-captcha/?captcha_token=" + data.data.captcha_token,
            imageCodeToken: data.data.captcha_token
          })
        }else{
          that.countDown()
        }
      } else {
        //获取失败的时候 重新可以点击
        that.setData({
          btnEnable: true
        })
        app.showloadingMessgage(data)

      }
    })
  },

  /**
   * 倒计时
   */
  countDown: function () {

    this.interval = setInterval(() => {
      if (this.data.count > 0) {
        this.setData({ count: this.data.count - 1, btnTitle: this.data.count + "s后获取", });
      }
      else {
        //在倒计时结束的时候 可以点击
        clearInterval(this.interval)
        this.setData({ count: 60, btnTitle: "获取验证码", btnEnable: true });
      }
    }, 1000);
  },
  
  /**
   * 输入框绑定事件
   */
  phoneInput: function (event) {
    this.setData({
      phoneNumber: event.detail.value,
    })
  },
  /**
   * 验证码输入框
   */
  arcInput: function (event) {
    this.setData({
      arcCode: event.detail.value,
    })
  },
  
  bindButtonClick: function () {
    //绑定 
    if (this.data.phoneNumber.length < 11) {
      wx.showModal({
        title: "",
        content: "请输入正确的手机号",
        showCancel: false,
      })
      return;
    }
    if (this.data.arcCode.length < 6) {
      wx.showModal({
        title: "",
        content: "请输入正确的验证码",
        showCancel: false,
      })
      return;
    }
    //开始绑定
    let app = getApp()
    let params = {
      "mobilePhone": this.data.phoneNumber,
      "code": this.data.arcCode,
      "wechatAppid": "wx7e2ebae8dad9ecf3",
      "authInfo": this.options,
    }
    app.getServerce(app.data.url + "/login/wechat-bind", "POST", params, (isSuccess, data) => {
      if (isSuccess) {
        //绑定成功
        //存token
        //存储绑定成功字段
        
         let token = "Base " + data.data.token.data
         wx.setStorageSync("USERTOKEN", token)
       //console.log("绑定成功")
          wx.navigateBack({
            delta: 1, // 回退前 delta(默认为1) 页面

          })
      } else {
        //绑定失败
        
        app.showloadingMessgage(data)

      }
    })

  },

  /**
   * 处理验证码
   */
  imageInputValueChanged(e) {
    
    let str1 = e.detail.value.slice(0, 1);
    let str2 = e.detail.value.slice(1, 2);
    let str3 = e.detail.value.slice(2, 3);
    let str4 = e.detail.value.slice(3, 4);
    this.setData({
      inputDefaltValue: e.detail.value,
      firstNumber: str1,
      secondNumber: str2,
      thirdNumber: str3,
      forthNumber: str4,

    })
  },
  /*
    提交图形验证码信息
  */
  submitImageCode() {
    let app = getApp()
    let params = {
      captcha_token: this.data.imageCodeToken,
      captcha_code: this.data.firstNumber + this.data.secondNumber + this.data.thirdNumber + this.data.forthNumber
    }
    app.getServerce(app.data.url + "/common/sms/verify-captcha-code/", "POST", params, (isSuccess, data) => {
      if (isSuccess) {
     //console.log(data)
        if (data.rc==0){
          this.didSubmitImageCode()
          this.countDown()
        }
       
      } else {
        app.showloadingMessgage(data)

        this.didRefreshImageCode()
      }
    })
  },
  cancelImageCode() {
    this.didCancelImageCode()
  },
  /* 刷新验证图片
  
    把倒计时重置180
    删除倒计时
    重新开启倒计时
    设置过期状态为false

    把已经输入的验证码 置空
   */
  changeImageCode() {
    //重新加载一遍
   
    this.didRefreshImageCode()
   
    this.setData({
      isChange:!this.data.isChange,
      imageCodeUrl: this.data.imageCodeUrl
    })
  },
  /*
    180s过期时间  图片验证码
    过期之后 设置 过期状态
    过期之后 重置已经输入的验证码
  */
  countDown180: function () {

    this.interval = setInterval(() => {
      if (this.data.outDateCount > 1) {
     //console.log(this.data.outDateCount)
        this.setData({
          outDateCount: this.data.outDateCount - 1
        })
      }
      else {
        //在倒计时结束的时候 可以点击
        clearInterval(this.interval)
        if (this.data.isShowImageCode) {
         
          this.didImageCodeOutDate()
        }

      }


    }, 1000);
  },
 
  didRefreshImageCode(){
    //验证码错误 或者  验证码过期
    //刷新
    clearInterval(this.interval)

    this.setData({
      outDateCount: 180,
      isChange:!this.data.isChange,
      isShowImageCode: true,
      isImageCodeOutTime: false,
      inputDefaltValue : '',
      firstNumber: '',
      secondNumber: '',
      thirdNumber: '',
      forthNumber: '',
    })
    this.countDown180()
  },
  /*
    imagecode过期了 需要做什么

    过期了重置输入框内容 重置已经输入的内容

    更新显示 点击刷新 按钮的状态
  */
  didImageCodeOutDate(){
    this.setData({
      isShowImageCode: true,
      isChange:!this.data.isChange,
      isImageCodeOutTime:true,
      inputDefaltValue: '',
      firstNumber: '',
      secondNumber: '',
      thirdNumber: '',
      forthNumber: '',
    })
  },
  /*
    取消输入验证码

    设置不显示验证码弹框

    重置验证码 url,token,重置输入框内容 和已经输入的内容

    重置过期时间

    重要一点  让btn能够再次点击
    提交成功 也重置
  */
  didCancelImageCode(){
    clearInterval(this.interval)

    this.setData({
      outDateCount: 180,
      isShowImageCode: false,
      imageCodeUrl: "",
      imageCodeToken: "",
      isImageCodeOutTime: false,
      inputDefaltValue: '',
      firstNumber: '',
      secondNumber: '',
      thirdNumber: '',
      forthNumber: '',
      btnEnable: true
    })
  },
  /*
    跟取消的区别是    倒计时之后 才可点击按钮
  */
  didSubmitImageCode() {
    clearInterval(this.interval)

    this.setData({
      outDateCount: 180,
      isShowImageCode: false,
      imageCodeUrl: "",
      imageCodeToken: "",
      isImageCodeOutTime: false,
      inputDefaltValue: '',
      firstNumber: '',
      secondNumber: '',
      thirdNumber: '',
      forthNumber: '',
    })
  },
})