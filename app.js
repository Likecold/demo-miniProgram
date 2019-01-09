//app.js
let meLocation = {};
let LOCATIN = "LOCATION"
let payType = ""
let orderId = ""
let weChatType = ""

App({

  data: {
    url:"http://*********",
    region: {}, //首页城市信息
    searchRegion: {}, //搜索页面的城市信息
    appid: "***********",
    selectedMealItems: [],  //下单时把套餐的 项目存一下 
    selectedAddMealItems: [], //把选择的加项项目存一下
    imageUrl: "https://small-routine.touchealth.com/", //图片的域名
    additionalItemPackage:[],  //加项包的list
    options:{}, //套餐详情mealId
  },
  
  onLaunch: function() {

  },


  /**
   * 数据请求封装
   * 1. url 请求地址
   * 2. requestType  GET POST DELETE
   * 3. 参数
   * 4. 回调 （isSuccess,data）->{}
   */
  getServerce(url, requestType, params, callback) {
    let that = this;
    wx.getNetworkType({
      success: function(res) {
        if (res.networkType == 'none') {
          callback(false, '好像没网了呀');
        } else {
          //---此方法为get方法
          let token = "";
          try {
            var value = wx.getStorageSync('USERTOKEN')
            if (value) {
              token = value;
            } else {
              token = "";
            }

            wx.request({
              url: url,
              data: params,
              header: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Client-Type': 'miniProgram',
                'Authorization': token
              },
              method: requestType,
              success: function(res) {
                //console.log(res.data)
                if (res.statusCode > 199 && res.statusCode < 300) {
                  if (res.data.rc == 0 || res.data.rc == 1003 || res.data.rc == 1008) {
                    callback(true, res.data)
                  } else if (res.data.rc == 1000) {
                    //异地登录
                    wx.removeStorageSync("USERTOKEN")

                    callback(false, "")
                  } else if (res.data.rc == 1001) {
                    //重新返回token
                    wx.setStorageSync("USERTOKEN", "Base " + res.data.data)
                    that.getServerce(url, requestType, params, callback)
                  } else {
                    callback(false, res.data.msg)
                  }
                } else if (res.statusCode == 400) {
                  callback(false, '服务器正在维护');
                } else if (res.statusCode == 401) {
                  wx.removeStorageSync("USERTOKEN")
                  callback(false, '');
                } else if (res.statusCode == 404) {
                  callback(false, '接口被外星人抓走了')
                } else if (res.statusCode == 500) {
                  callback(false, '服务器正在维护');
                } else {
                  callback(false, "服务器正在维护");
                }
              },
              fail: function(error) {
                // fail
                // callback(false, '服务器正在维护');
                callback(false, '服务器正在维护');

              },
              complete: function(res) {
                // complete
              }
            })
          } catch (e) {
            // Do something when catch error
          }
        }
      },
    })


  },


  /**
   * 用户登录
   * 1. 获取用户code
   * 2. 把code传给服务器获取用户绑定信息
   */
  userLogin() {

    let token = wx.getStorageSync("USERTOKEN")
    if (token) {
     
      return
    }
    wx.showToast({
      title: '登录中',
      icon: 'loading'
    })
    console.log("token不存在")
    let that = this
    wx.login({
      success: function(res) {
        if (res.code) {
          //发起网络请求
          that.postInfo(res.code)
        } else {
          wx.hideToast()
        }
      },
      fail: function(res) {
        console.log("获取code失败")
        console.log(res)
      }
    });
  },




  /**
   * 提交用户相关信息到服务器
   * 1003 账号未绑定手机号 需要绑定手机号
   * 1008 获取不到用的unionid 需要用户授权登录
   * else 已有账号信息
   */
  postInfo(code) {
    let params = {
      "wechatCode": code,
      "wechatAppid": "wx7e2ebae8dad9ecf3",
      "isComponent": false,
      "applicationType": "miniProgram"
    }

    let that = this;
    var app = getApp()

    app.getServerce(app.data.url + '/login/login-by-wechatcode', "POST", params, (isSuccess, data) => {
      wx.hideToast()
      if (isSuccess) {

        if (data.rc == 1003) {
          //需要绑定
          //console.log("未绑定，需要绑定")
          //console.log(data.data)
          wx.setStorageSync("bindData", data.data)

          wx.navigateTo({
            url: "../bindCount/bindCount"
          })
        } else if (data.rc == 1008) {
          //console.log(data)
          wx.navigateTo({
            url: '../authorization/authorization?session_key=' + data.data.session_key,
          })
        } else {
          //已经绑定 存下token
          //console.log("已经绑定账号")
          //console.log(data)
          wx.setStorageSync("USERTOKEN", "Base " + data.data.token.data)
        }
      } else {
        that.showloadingMessgage(data)

      }

    })

  },


  showWXModal(data) {
    wx.hideLoading()
    wx.showModal({
      title: '',
      content: data,
      showCancel: false
    })
  },



  /**
   * 支付
   * orderId 订单id
   * payType 支付类型 下单支付 newOrder 订单列表支付 orderList  订单详情支付 orderDetail
   */
  payWithOrderId: function(orderIdParam, payTypeParam, weChatTypeParma) {
    payType = payTypeParam
    orderId = orderIdParam
    weChatType = weChatTypeParma
    this.getOpenId()
  },



  /**
   * 通过appid获取openid
   * 1. openid 获取正常，更新支付参数
   * 2. 若为空，通过另一个接口继续获取
   */
  getOpenId: function() {

    this.getServerce(
      this.data.url + '/user/find-openid-by-appid?appid=wx7e2ebae8dad9ecf3', 'GET', {},
      (isSuccess, json) => {
        if (isSuccess) {

          //console.log(json)
          let openid = json.data
          if (openid == null) {
            //console.log("获取openid成功,但为空")
            this.getOpenIdAgain()
          } else {
            //console.log("获取openid成功")
            this.updatePayParams(openid)
          }
        } else {
          // app.showWXModal(data)
          //console.log("获取openid失败")
        }
      })
  },



  /**
   * 再次获取code
   */
  getOpenIdAgain: function() {
    let that = this;
    wx.login({
      success: function(res) {
        if (res.code) {
          //发起网络请求
          //console.log("再次获取code成功")
          //console.log(res.code)
          that.getOpenIdFromNet(res.code)
        } else {
          //console.log('登录失败！' + res.errMsg)
        }
      },
      fail: function(res) {
        //console.log("获取code失败")
        //console.log(res)

      }
    });
  },



  /**
   * 通过再次获取的code换区openid
   * 1. 获取成功之后 更新支付方式
   */
  getOpenIdFromNet: function(code) {
    let params = {
      "appid": "wx7e2ebae8dad9ecf3",
      "code": code,
      "applicationType": "miniProgram",
    }
    this.getServerce(this.data.url + '/login/get-wechat-openid', "GET", params, (isSuccess, data) => {
      if (isSuccess) {
        //console.log("再次获取openId成功")
        let openid = data.data
        this.updatePayParams(openid)
      } else {
        //console.log("再次获取openid失败")
      }
    })
  },




  /**
   * 更新支付信息 获取支付参数
   */
  updatePayParams: function(openid) {
    //查询openid

    let params = {
      "id": orderId,
      "paymentChannel": "1002",
      "tradeType": 2,
      "aggregatePayment": "101",
      "openid": openid
    }
    //console.log(params)
    this.getServerce(
      this.data.url + '/reservation/checkup/pay', 'POST',
      params,
      (isSuccess, data) => {
        if (isSuccess) {
          //console.log("更新成功")
          if (data.data) {
            let payParams = data.data
            this.callWeChatPayment(payParams)
          } else {
            this.showPaySuccessModal()
          }
          //调用微信支付
        } else {
          // app.showWXModal(data)
          //console.log(data)
          wx.hideLoading()
        }
      })

  },
  //调用微信支付
  callWeChatPayment: function(payParams) {
    wx.hideLoading()
    let that = this
    wx.requestPayment({
      timeStamp: payParams.paymentParams.timestamp,
      nonceStr: payParams.paymentParams.nonceStr,
      package: payParams.paymentParams.package,
      signType: payParams.paymentParams.signType,
      paySign: payParams.paymentParams.paySign,
      appId: payParams.paymentParams.appId,
      id: payParams.paymentParams.id,
      success: function() {
        that.showPaySuccessModal()
        //console.log("成功")
      },
      fail: function(e) {
        that.showPayFailModel()
        //console.log(e)
        //console.log("支付失败")
      }
    })
  },
  showPaySuccessModal: function() {
    //完成下单
    wx.hideLoading()
    let that = this
    if (payType == "newOrder") {
      that.showOrderDetail()
    } else if (payType == "orderList") {
      let that = this
      this.showloadingMessgage("支付成功");
      if (weChatType == "weChat") {
        wx.navigateTo({
          url: "../OrderDetailNew/OrderDetailNew?id=" + orderId + "&type=weChat",
        })
      } else {
        wx.navigateTo({
          url: '../OrderDetailNew/OrderDetailNew?id=' + orderId,
        })
      }




    } else if (payType == "orderDetail") {
      let that = this
      this.showloadingMessgage("支付成功");
      setTimeout(function() {
        that.showOrderDetail()
      }, 2000)

    }


  },

  showPayFailModel: function() {
    wx.hideLoading()

    let that = this
    if (payType == "newOrder") {
      this.showloadingMessgage("支付失败");
      setTimeout(function() {
        that.showOrderDetail()
      }, 2000)


    } else if (payType == "orderList") {
      this.showloadingMessgage("支付失败");


    } else if (payType == "orderDetail") {
      this.showloadingMessgage("支付失败");
    }
  },
  /**
   * 发送formid
   */
  postFormId: function(formId) {

    this.getServerce(
      this.data.url + "/user/collect-miniprogram-formid", 'POST', {
        "formId": formId,
        "appid": this.data.appid
      },
      (isSuccess, data) => {

      })
  },
  /**
   * 跳转订单详情
   */
  showOrderDetail: function() {
    //如果是微信城市服务  支付进来的 还要带上type 参数
    if (weChatType == "weChat") {
      wx.navigateTo({
        url: "../OrderDetailNew/OrderDetailNew?id=" + orderId + "&type=weChat",
      })
    } else {
      wx.redirectTo({
        url: '../OrderDetailNew/OrderDetailNew?id=' + orderId,
      })
    }

  },
  showloadingMessgage: function(message) {
    if (message == "") {
      return
    }
    wx.showToast({
      title: message,
      icon: "none"
    })

    setTimeout(function() {
      wx.hideToast()
    }, 2000)
  }
})