let appInstance = getApp();
Page({
  pageNo: 1,
  options: {},
  data: {
    comBoCellData: [],//套餐数据
    hospitalData: {},//医院数据
    scrollViewHeight: 0,
    isLoadComplete: false,//是否加载完毕
    isShowNoMeals: false,//是否显示没有套餐页面
  },
  onPullDownRefresh: function () {
    this.getDatas()
  },
  onShow: function () {
    appInstance.data.options = {};  //清空保存在套餐详情的mealId
    appInstance.data.additionalItemPackage = []
  },

 /**
   * 针对页面传值或者扫码传值就行判定
   */

  onLoad: function (options) {
    var _this = this
    wx.getSystemInfo({
      success: function (res) {
        var height = res.windowHeight * 750 / res.windowWidth
        _this.setData({
          scrollViewHeight: height,
        })
      }
    })

    //医院id存在就拼接
    if (options.hid) {
      //重新给地址赋值
      let urlDic = {
        hospital: appInstance.data.url + "/hospital/" + options.hid,
        setmeals: appInstance.data.url + "/set-meal-list?hospitalId=" + options.hid,
      }
      this.options = urlDic
      this.getDatas()

    } else {
      //console.log("医院id不存在")
    }
  },

  getDatas: function () {

    var _this = this;
    wx.showNavigationBarLoading()
    //获取单个医院数据
    appInstance.getServerce(this.options.hospital, "GET", {}, (isSuccess, data) => {
      if (isSuccess) {
        _this.setData({
          hospitalData: data.data
        })
      } else {
        appInstance.showloadingMessgage(data)
      }
    })
    let params = {
      "pageSize": 500,
      "pageNo": 1
    }
    //获取套餐列表数据
    appInstance.getServerce(this.options.setmeals, "GET", params, (isSuccess, data) => {
      if (isSuccess) {
        // success
        /**
         * 处理  600.00 为600  和 .00
         */
        wx.hideNavigationBarLoading()
        var isShowNoMeals1 = true;
        if (data.data.resultList.length == 0) {
          isShowNoMeals1 = false;
        }
        var arr = _this.resolveMealData(data.data.resultList)

        _this.setData({
          comBoCellData: arr,
          isShowNoMeals: isShowNoMeals1,
        })
        //关闭刷新
        wx.stopPullDownRefresh()
      } else {
        appInstance.showloadingMessgage(data)
      }
    })

  },
 /**
   * 加载更多数据
   */
  loadMoreData: function () {
    return
    var _this = this;
    wx.showNavigationBarLoading()
    let params = {
      "pageSize": 20,
      "pageNo": this.pageNo
    }
    //console.log(params)
    //console.log(this.options.setmeals)
    //获取套餐列表数据
    appInstance.getServerce(this.options.setmeals, "GET", params, (isSuccess, data) => {
      wx.hideNavigationBarLoading()
      if (isSuccess) {
        // success
        var arr = data.data.resultList
        if (arr.length == 0) {
          this.setData({
            isLoadComplete: true
          })
        } else {
          var arr = _this.resolveMealData(data.data.resultList)
          _this.setData({
            comBoCellData: this.data.comBoCellData.concat(arr)
          })
        }

      } else {
        appInstance.showloadingMessgage(data)

      }
    })

  },

   /**
   * 处理套餐数据
   * 价格统一
   * 实现小数点规整
   */
  resolveMealData: function (data) {
    var arr = data
    for (let i in arr) {
      let retailPrice = parseFloat(arr[i].retailPrice).toFixed(4).toString()
      let salePrice = parseFloat(arr[i].salePrice).toFixed(4).toString()
      arr[i].retailPrice = retailPrice.slice(0, retailPrice.length - 2)
      arr[i].salePrice = salePrice.slice(0, salePrice.length - 2)
      arr[i].salePriceBeforePoint = salePrice.slice(0, salePrice.length - 5)
      arr[i].salePricePoint = salePrice.slice(salePrice.length - 5, salePrice.length - 2)
    }
    return arr
  },
  pushToComboDetail: function (event) {

    wx.navigateTo({
      url: '../NewMealDetail/NewMealDetail?mealId=' + event.currentTarget.dataset.id
    })

  },


 /**
   * 页面分享配置
   */
  onShareAppMessage: function () {
    return {
      title: (this.data.hospitalData.name || '一键康医院') + '套餐',
      path: '/pages/meals/meals?hid=' + this.data.hospitalData.id
    }
  },



  /**
   * 打开导航
   */
  openLocation: function () {
    let gg = this.bd09togcj02(this.data.hospitalData.longitude, this.data.hospitalData.latitude)
    wx.openLocation({
      latitude: gg[1],
      longitude: gg[0],
      name: this.data.hospitalData.name
    })
  },

  onReachBottom: function () {
    // this.loadMoreMeals()
  },

  /**
   * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
   * 即 百度 转 谷歌、高德
   * @param bd_lon
   * @param bd_lat
   * @returns {*[]}
   */
  bd09togcj02: function (bd_lon, bd_lat) {
    //定义一些常量
    var x_PI = 3.14159265358979324 * 3000.0 / 180.0
    var PI = 3.1415926535897932384626
    var a = 6378245.0
    var ee = 0.00669342162296594323

    var x_pi = 3.14159265358979324 * 3000.0 / 180.0
    var x = bd_lon - 0.0065
    var y = bd_lat - 0.006

    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi)
    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi)
    var gg_lon = z * Math.cos(theta)
    var gg_lat = z * Math.sin(theta)
    return [gg_lon, gg_lat]
  }

})