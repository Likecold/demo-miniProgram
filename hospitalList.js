let appInstance = getApp();
var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
//等级
let grade = '';
//定位城市
let city = ""
//存定位的标识符
let LOCATIN = "LOCATION"
//用户经纬度
let userLo = ""
let userLa = ""
var qqmapsdk;

Page({
  pageNo: 1,
  data: {
    isShowSorry: false,
    city: '正在定位',
    area: "全部地区",
    grade: "全部等级",
    //---医院数组
    array: [],
    isLoadComplete: false,//是否加载完毕
    isNearbyMyself: false,//是否离我最近
    areas: [],//地区
    isSortArea: false,
    isSortGrade: false,
    selectedGradeIndex: 0,
    selectedAreaIndex: 0,
    isFirstGetData: true,
    imageurl: appInstance.data.imageUrl,
  },

/**
 * 根据APP.js 的城市信息判断是否应该刷新当前页面
 */
  onShow: function() {
    if (appInstance.data.region.city) {
      if (appInstance.data.region.city != this.data.city) {
        let all = ["全部地区"]
        this.setData({
          area: "全部地区",
          grade: "全部等级",
          city: appInstance.data.region.city,
          areas: all.concat(appInstance.data.region.areas),
          selectedAreaIndex: 0,
          selectedGradeIndex: 0,
          isLoadComplete: false
        })
        this.getHospitalList()
      } else {
        //  this.getHospitalList()
      }

    }




  },
  bindGetUserInfo: function(e) {
    //console.log(e)
  },

  onLoad: function(options) {
    let that = this;
    wx.onNetworkStatusChange(function(res) {
      if (res.isConnected) {
        wx.hideLoading()
        that.getHospitalList()
      }
    })
    var _this = this
    wx.getSystemInfo({
      success: function(res) {
        var height = res.windowHeight * 750 / res.windowWidth
        _this.setData({
          windowHeight: height
        })
      }
    })
    //需要登录
    this.getposition()
  },
  /**
   * 获取各个城市各个区的编码号
   * 1. 定位
   * 2. 反编译经纬度城市信息
   * 3. 后端接口返回数据
   */
  getposition() {
    let that = this;
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: 'MPKBZ-MYNCF-JVKJA-J73A4-OM74V-N2BOZ'
    });
    wx.getLocation({
      type: 'wgs84',
      success: function(res) {
        let userLocation = {
          latitude: res.latitude,
          longitude: res.longitude,
        }
        userLa = res.latitude
        userLo = res.longitude
        wx.setStorageSync(LOCATIN, userLocation)
        //---定位成功获取医院列表
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude,
          },
          success: function(results) {
            // ("腾讯地图反编码成功")

            var province = results.result.address_component.province;
            var city = results.result.address_component.city;
            wx.setStorageSync('LOCATIONCITY', city);

            appInstance.getServerce(appInstance.data.url + '/current-city/', "POST", {
              "cityName": city
            }, (isSuccess, json) => {
              if (isSuccess) {
                //定位城市存在
                //存地区
                //存下地区列表和城市
                let allArea = ["全部地区"]
                that.setData({
                  city: city,
                  areas: allArea.concat(json.data.areas)
                })
                let region = appInstance.data.region
                region.city = city
                region.areas = json.data.areas
                that.getHospitalList();

              } else {
                //定位城市未开通  选择城市
                // let _this = this
                wx.showModal({
                  title: '',
                  content: "定位城市暂未开通,请选择城市",
                  showCancel: false,
                  success: function(res) {
                    if (res.confirm) {
                      wx.navigateTo({
                        url: '../chooseCity/chooseCity?lookCity=' + that.data.city,
                      })
                    } else if (res.cancel) {}
                  }
                })
              }
            })



          },
          fail: function(results) {
            // 腾讯地图反编码错误
            if (results.status == 1000) {
              wx.showModal({
                title: '',
                content: '好像没网了呀',
                showCancel: false,
              })
            }

          },
          complete: function(results) {}
        });
      },
      fail: function(err) {
        //console.log(err)
        //获取定位失败
        if (err.errMsg == "getLocation:fail auth deny") {
          wx.navigateTo({
            url: '../chooseCity/chooseCity?lookCity=' + "定位失败",
          })
        } else {
          wx.showModal({
            title: '',
            content: '定位失败,请选择城市',
            showCancel: false,
            success: function(res) {
              wx.navigateTo({
                url: '../chooseCity/chooseCity?lookCity=' + "定位失败",
              })
            }
          })
        }

      },
      complete: function() {
        // complete
      }
    })
  },


  onReady: function() {
    // 页面渲染完成
  },

  getHospitalList() {
    wx.showNavigationBarLoading()
    //为了判断是否显示抱歉，未找到医院
    this.pageNo = 1
    let url = appInstance.data.url + '/search/hospital/'
    let params = {
      "pageSize": 20,
      "pageNo": this.pageNo,
      "grade": this.data.grade == "全部等级" ? "" : this.data.grade,
      "city": this.data.city == "定位失败" || this.data.city == "正在定位" ? "杭州市" : this.data.city,
      "district": this.data.area == "全部地区" ? "" : this.data.area,
      "searchCondition": "",
      "longitude": userLo,
      "latitude": userLa,
      "isDistance": this.data.isNearbyMyself
    }
    let hospitalAry = []
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    this.setData({
      array: [],
      isShowSorry: false,
    })
    appInstance.getServerce(url, "GET", params, (isSuccess, data) => {
      wx.hideLoading()
      wx.hideNavigationBarLoading()
      if (isSuccess) {
        let results = data.data.resultList
        if (results.length == 0 && this.data.isFirstGetData == false) {
          this.setData({
            array: [],
            isShowSorry: true
          })
        }
        for (let m = 0; m < results.length; m++) {
          let bean = results[m];

          /**
           * 处理占位图
           */
          if (bean.icon_pic) {
            //图片存在 不处理
          } else {
            bean.icon_pic = this.data.imageUrl + 'icon_ty_yy@2x.png'
          }
          if (bean.canAddition == true) {
            bean.hospitalTags2 = ["可加项"]
          }
          hospitalAry.push(bean);

        }
        this.setData({
          array: hospitalAry,
          isFirstGetData: false
        })

      } else {
        appInstance.showloadingMessgage(data)

      }

    });


  },
  loadMoreHospitalList() {
    //为了判断是否显示抱歉，未找到医院

    let url = appInstance.data.url + '/search/hospital/'
    let params = {
      "pageSize": 20,
      "pageNo": this.pageNo,
      "grade": this.data.grade == "全部等级" ? "" : this.data.grade,
      "city": this.data.city == "定位失败" || this.data.city == "正在定位" ? "杭州市" : this.data.city,
      "district": this.data.area == "全部地区" ? "" : this.data.area,
      "searchCondition": "",
      "longitude": userLo,
      "latitude": userLa,
      "isDistance": this.data.isNearbyMyself
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


  cancle: function() {
    this.setData({
      isshowView: true,
    });
  },






  //条目点击事件
  pushToHospitalList: function(event) {
    let itemDetail = event.currentTarget.dataset.item;
    wx.navigateTo({
      url: '../meals/meals?hid=' + itemDetail.id
    })


  },

  onShareAppMessage: function() {
    return {
      title: '一键康医院列表',
      path: '/pages/hospitalList/hospitalList'
    }
  },
  //跳转搜索页面
  gotoSearchPage: function() {
    wx.navigateTo({
      url: '../searchPageTow/searchPageTow',
    })
  },

  /**选择城市信息 */
  chooseCity: function() {

    wx.navigateTo({
      url: '../chooseCity/chooseCity?lookCity=' + this.data.city,
    })
  },

  scrollToBottom: function(e) {
    if (this.data.isLoadComplete == true) {
      //console.log("加载完成")
    } else {
      this.pageNo = this.pageNo + 1
      this.loadMoreHospitalList()
    }

  },

  /**
   * 全部等级点击事件
   */
  sortGradeClick: function() {
    this.setData({
      isSortGrade: !this.data.isSortGrade,
      isSortArea: false
    })
  },
  /**
   * 全部地区点击事件
   */
  sortAreaClick: function() {
    this.setData({
      isSortGrade: false,
      isSortArea: !this.data.isSortArea
    })
  },
  /**
   * 离我最近点击方法
   */
  neaderByClick: function() {

    this.setData({
      isNearbyMyself: !this.data.isNearbyMyself,
      isSortGrade: false,
      isSortArea: false
    })
    this.getHospitalList()
  },

  /**
   * 地区cell点击方法
   */
  sortAreaCellDidClck: function(e) {
    this.setData({
      selectedAreaIndex: e.currentTarget.dataset.index,
      isSortArea: false,
      area: e.currentTarget.dataset.area
    })
    this.getHospitalList()
  },

  cancelSortArea: function() {
    this.setData({
      isSortArea: false,
    })
  },
  /**
   * 等级筛选
   */
  sortGradeCellDidClck: function(e) {
    this.setData({
      selectedGradeIndex: e.currentTarget.dataset.index,
      isSortGrade: false,
      grade: e.currentTarget.dataset.grade
    })
    this.getHospitalList()
  },
  cancelSortGrade: function() {
    this.setData({
      isSortGrade: false,
    })
  },


})