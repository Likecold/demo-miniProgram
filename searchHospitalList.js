// pages/searchHospitalList/searchHospitalList.js
var content = "";
let appInstance = getApp();
//等级
let grade = '';
//定位城市
let city = ""
//存定位的标识符
let LOCATIN = "LOCATION"
//用户经纬度
let userLo = ""
let userLa = ""
var isBlack = true;
Page({
  pageNo: 1,
  /**
   * 页面的初始数据
   */
  data: {
    windowHeight: 0,
    isshow: true,
    area: "",
    grade: "全部等级",
    array: [],
    isLoadComplete: false,
    isNearbyMyself: false,
    areas: [],
    isSortArea: false,
    isSortGrade: false,
    selectedGradeIndex: 0,
    selectedAreaIndex: 0,
    isFirstGetData: true,
    isSecond: false,
    imageurl: appInstance.data.imageUrl,
    contents: '', //传过来的内容

  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this
    wx.getSystemInfo({
      success: function (res) {
        var height = res.windowHeight * 750 / res.windowWidth
        _this.setData({
          windowHeight: height,
        })
      }
    }),
      content = options.content //获取传过来的搜索值
  },

  getHospitalList() {

    //为了判断是否显示抱歉，未找到医院
    this.pageNo = 1
    let url = appInstance.data.url + '/search/hospital/'
    let userLocation = wx.getStorageSync("LOCATION")
    // let region = appInstance.data.region
    var that = this;
    let region = appInstance.data.region
    let searchRegion = appInstance.data.searchRegion
    if (searchRegion.city == null) {
      var params = {
        "pageSize": 20, //每页显示的item个数
        "pageNo": this.pageNo, //加载第几页的内容
        "longitude": userLocation.longitude, //经度
        "latitude": userLocation.latitude, //纬度
        "grade": (this.data.grade == "全部等级") || (this.data.isFirstGetData == false) ? "" : this.data.grade, //等级
        "city": this.data.isFirstGetData == true ? region.city : "", //城市
        "district": (this.data.area == "全" + region.city) || (this.data.isFirstGetData == false) ? "" : this.data.area, //地区
        "searchCondition": content, //传过来的搜索参数
        "isDistance": this.data.isNearbyMyself //是否离我最近
      }
    } else {
      var params = {
        "pageSize": 20, //每页显示的item个数
        "pageNo": this.pageNo, //加载第几页的内容
        "longitude": userLocation.longitude, //经度
        "latitude": userLocation.latitude, //纬度
        "grade": (this.data.grade == "全部等级") || (this.data.isFirstGetData == false) ? "" : this.data.grade, //等级
        "city": this.data.isFirstGetData == true ? searchRegion.city : "", //城市
        "district": (this.data.area == "全" + searchRegion.city) || (this.data.isFirstGetData == false) ? "" : this.data.area, //地区
        "searchCondition": content, //传过来的搜索参数
        "isDistance": this.data.isNearbyMyself //是否离我最近
      }
    }
    let hospitalAry = []
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    this.setData({
      array: [],
    })
    appInstance.getServerce(url, "GET", params, (isSuccess, data) => {
      wx.hideLoading()

      if (isSuccess) {
        console.log(data)
        let results = data.data.resultList
        //1.进入请求，请求成功，有数据，isFirstGetData==true,是第一次请求，并且数组不等于0.正常显示。
        //2.进入请求，是否等于0，等于0，清空数组，把当前的是否第一次请求设置为否，然后再次调用当前的请求方法再次请求。
        //3.如果再次请求，请求的参数还是为0，而且是第二次请求（ isFirstGetData= false），那就显示没有数据情况
        if (results.length == 0) {
          this.setData({
            array: [],
          })
          //如果结果是0，又是第一次进来，那就从新请求，如果结果是0,又是第二次进来，那就不再调用请求的方法
          if (this.data.isFirstGetData == true) {
            this.setData({
              isFirstGetData: false,
            })
            that.getHospitalList();
          }


        } else {
          //第一次进来
          if (this.data.isFirstGetData == true) {
            for (let m = 0; m < results.length; m++) {
              let bean = results[m];
              if (bean.icon_pic) {
                //图片存在 不处理
              } else {
                bean.icon_pic = this.data.imageurl + 'icon_ty_yy@2x.png'
              }
              if (bean.canAddition == true) {
                bean.hospitalTags2 = ["可加项"]
              }
              hospitalAry.push(bean);
              this.setData({
                array: hospitalAry,
                isFirstGetData: true
              })
            }
          } else { //第二次进来
            console.log("====222===")
            for (let m = 0; m < results.length; m++) {
              let bean = results[m];
              if (bean.icon_pic) {
                //图片存在 不处理
              } else {
                bean.icon_pic = this.data.imageurl + 'icon_ty_yy@2x.png'
              }
              if (bean.canAddition == true) {
                bean.hospitalTags2 = ["可加项"]
              }
              hospitalAry.push(bean);
              //第二次进来
              this.setData({
                array: hospitalAry,
                isFirstGetData: false,
              })
            }
          }

        }

      } else {
        appInstance.showloadingMessgage(data)

      }

    });


  },
  loadMoreHospitalList() {
    //为了判断是否显示抱歉，未找到医院
    let url = appInstance.data.url + '/search/hospital/'
    let userLocation = wx.getStorageSync("LOCATION")
    let region = appInstance.data.region
    let searchRegion = appInstance.data.searchRegion
    if (searchRegion.city == null) {
      var params = {
        "pageSize": 20, //每页显示的item个数
        "pageNo": this.pageNo, //加载第几页的内容
        "longitude": userLocation.longitude, //经度
        "latitude": userLocation.latitude, //纬度
        "grade": (this.data.grade == "全部等级") || (this.data.isFirstGetData == false) ? "" : this.data.grade, //等级
        "city": this.data.isFirstGetData == true ? region.city : "", //城市
        "district": (this.data.area == "全" + region.city) || (this.data.isFirstGetData == false) ? "" : this.data.area, //地区
        "searchCondition": content, //传过来的搜索参数
        "isDistance": this.data.isNearbyMyself //是否离我最近
      }
    } else {

      var params = {
        "pageSize": 20, //每页显示的item个数
        "pageNo": this.pageNo, //加载第几页的内容
        "longitude": userLocation.longitude, //经度
        "latitude": userLocation.latitude, //纬度
        "grade": (this.data.grade == "全部等级") || (this.data.isFirstGetData == false) ? "" : this.data.grade, //等级
        "city": this.data.isFirstGetData == true ? searchRegion.city : "", //城市
        "district": (this.data.area == "全" + searchRegion.city) || (this.data.isFirstGetData == false) ? "" : this.data.area, //地区
        "searchCondition": content, //传过来的搜索参数
        "isDistance": this.data.isNearbyMyself //是否离我最近
      }
    }
    let hospitalAry = []
    wx.showLoading({
      title: '加载中',
      mask: true,
    })

    appInstance.getServerce(url, "GET", params, (isSuccess, data) => {
      wx.hideLoading()

      if (isSuccess) {
        let results = data.data.resultList
        if (results.length == 0) {
          this.setData({
            isLoadComplete: true
          })
        } else {
          let data = this.data.array.concat(results)
          this.setData({
            array: data
          })
        }


      } else {
        wx.showModal({
          title: '',
          content: data,
          showCancel: false,
        })

      }

    });
  },

  scrollToBottom: function (e) {
    if (this.data.isLoadComplete == true) {
      //console.log("加载完成")
    } else {
      this.pageNo = this.pageNo + 1
      this.loadMoreHospitalList()
    }

  },



  //条目点击事件
  pushToHospitalList: function (event) {

    let itemDetail = event.currentTarget.dataset.item;
    isBlack = false  //当为false的时候，点击该方法，不会回退到首页
    wx.navigateTo({
      url: '../meals/meals?' + "hid=" + itemDetail.id
    })
  },




  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let region = appInstance.data.region
    let searchRegion = appInstance.data.searchRegion

    if (searchRegion.city == null) {
      let all = ["全" + region.city]
      this.setData({
        area: "全" + region.city,
        grade: "全部等级",
        city: appInstance.data.region.city,
        areas: all.concat(region.areas),
        selectedAreaIndex: 0,
        selectedGradeIndex: 0,
        isLoadComplete: false,
        contents: content
      })
      this.getHospitalList()
    } else {
      let all = ["全" + searchRegion.city]
      this.setData({
        area: "全" + searchRegion.city,
        grade: "全部等级",
        city: appInstance.data.searchRegion.city,
        areas: all.concat(searchRegion.areas),
        selectedAreaIndex: 0,
        selectedGradeIndex: 0,
        isLoadComplete: false,
        contents: content,
      })
      this.getHospitalList()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {


    if (isBlack == false) {

    } else {
      var pages = getCurrentPages(); // 当前页面
      var beforePage = pages[pages.length - 3]; // 前一个页面
      // console.log("beforePage");
      // console.log(beforePage);
      wx.navigateBack({
        success: function () {
          beforePage.onLoad(); // 执行前一个页面的onLoad方法
        }
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 全部等级点击事件
   */
  sortGradeClick: function () {
    this.setData({
      isSortGrade: !this.data.isSortGrade,
      isSortArea: false,
      isFirstGetData: true
    })
  },
  /**
   * 全部地区点击事件
   */
  sortAreaClick: function () {
    this.setData({
      isSortGrade: false,
      isSortArea: !this.data.isSortArea,
      isFirstGetData: true
    })
  },
  /**
   * 离我最近点击方法
   */
  neaderByClick: function () {

    this.setData({
      isNearbyMyself: !this.data.isNearbyMyself,
      isSortGrade: false,
      isSortArea: false,
      isFirstGetData: true
    })
    this.getHospitalList()
  },

  /**
   * 地区cell点击方法
   */
  sortAreaCellDidClck: function (e) {
    this.setData({
      selectedAreaIndex: e.currentTarget.dataset.index,
      isSortArea: false,
      area: e.currentTarget.dataset.area,
      isFirstGetData: true
    })
    this.getHospitalList()
  },

  cancelSortArea: function () {
    this.setData({
      isSortArea: false,
    })
  },
  /**
   * 等级筛选
   */
  sortGradeCellDidClck: function (e) {
    this.setData({
      selectedGradeIndex: e.currentTarget.dataset.index,
      isSortGrade: false,
      grade: e.currentTarget.dataset.grade,
      isFirstGetData: true
    })
    this.getHospitalList()
  },
  cancelSortGrade: function () {
    this.setData({
      isSortGrade: false,
    })
  },

  /**
   * 选择城市
   */
  chooseCity: function () {
    this.setData({
      isFirstGetData: true
    })
    isBlack = false  //当为false的时候，点击该方法，不会回退到首页
    wx.navigateTo({
      url: '../chooseCity/chooseCity?lookCity=' + this.data.city + "&type=" + "searchHospitalList",
    })
  },

  /**
   * 返回上一个页面
   */

  blackClick: function () {
    isBlack = false  //当为false的时候，点击该方法，不会回退到首页
    var pages = getCurrentPages(); // 当前页面
    var beforePage = pages[pages.length - 2]; // 前一个页面
    wx.navigateBack({
      success: function () {
        beforePage.onLoad(); // 执行前一个页面的onLoad方法
      }
    });
  },

})