let app = getApp()

Page({

  inputValue: "",
  postData: '',
  data: {
    //上个页面传进来的数据
    options: {},
    //当前年月日 
    tagDate: {
      year: 0,
      month: 0,
      day: 0
    },
    nowYear: 0,
    nowMonth: 0,
    nowDate: 0,
    year: 0,
    month: 0,
    day: 0,
    //第一行的周几数组
    arr: ["日", "一", "二", "三", "四", "五", "六"],
    //每个月第一天周几
    fistDayWeek: 0,
    //所有的日期数组
    dataSource: [],
    //选中的下标
    selectDate: {
      year: 0,
      month: 0,
      day: 0
    },
    //显示在页面中的日期
    showDate: {
      year: 0,
      month: 0,
      day: 0
    },

    // 服务费modal动画对象
    seviceAnimationData: {},
    // 日历modal动画对象
    animationData: {},
    allowOrderTimes: [],
    // 服务费modal是否显示
    showService: false,
    // 日历是否显示
    showModal: false,
    //更换选中图片
    showIndex: 999,
    windowHeight: 0,
    isCanMakeOrder: true,
    onShow: false,
    //选择的体检人
    selectedContact: {},
    isSelectedContact: false,
    selectedIndex: 999, //没有选择体检人
    totalFee: 0, //总金额
    showFee: 0, //小数点后面的,使用代金券的时候 要用到toalFee-代金券价格   不能修改totalFee
    selectedVouncher: {}, //代金券
    selectedVouncherIndex: 999,
    isSelectedVouncher: false,
    vouncherWord: "", //代金券选择的文案
    isShowNext: 0, //下一个月按钮的点击次数
    isShowCalendar: false, //是否显示日历
    isShowMarriedNotice: false, //是否显示已婚套餐提示
    itemsCount: 0, //体检项目的个数
  },
  formSubmit: function(e) {
    let app = getApp()
    app.postFormId(e.detail.formId)
  },

  onLoad: function(options) {

    //通过options 计算项目的个数

    let itemsCount = getApp().data.selectedMealItems.length + getApp().data.selectedAddMealItems.length
    this.data.itemdata = {}
    this.setData({
      options: options,
      totalFee: options.beforePoint + options.point,
      showFee: options.beforePoint + options.point,
      itemsCount: itemsCount + parseInt(options.additionDataNumber)
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
    //获取有多少张可用代金券
    this.getVouncherNumber()
    // 获得医院允许预约的日期
    this.getAllowBookTime()
  },

/**
 * 获取代金券个数
 */
  getVouncherNumber: function() {
    let url = app.data.url + "/voucher"
    let params = {
      "hospitalId": this.data.options.hid,
      "mealId": this.data.options.mid,
      "pageSize": "10000",
      "currentPage": "0",
      "isValid": "true"
    }
    //有代金券要传  couponId
    app.getServerce(
      url, 'GET',
      params,
      (isSuccess, data) => {
        if (isSuccess) {
          //console.log(data.data.totalCanUse)
          if (data.data.totalCanUse > 0) {
            this.setData({
              vouncherWord: "有" + data.data.totalCanUse + "张可用"
            })
          } else {
            this.setData({
              vouncherWord: "暂无可用"
            })
          }
        } else {
          // app.showloadingMessgage(data)

        }
      })
  },

  // 付款点击事件
  payEvent: function() {

    if (this.data.selectDate.year == 0) {

      app.showloadingMessgage("请选择体检时间");
      return
    }
    if (this.data.isSelectedContact == false) {
      app.showloadingMessgage("请选择体检人");
      return
    }
    let contact = {
      id: this.data.selectedContact.id,
      identity: this.data.selectedContact.identity,
      name: this.data.selectedContact.name,
      mobileNo: this.data.selectedContact.mobilePhone,
      relation: this.data.selectedContact.relation,
      maritalStatus: this.data.selectedContact.maritalStatus
    }
    let addMealIds = ""
    var pushAdditionPackage = [];

    //加项
    if (app.data.additionalItemPackage.length > 0) {
      let addItems = app.data.additionalItemPackage
      let idsAry = []
      for (let i = 0; i < addItems.length; i++) {
        if (addItems[i].additionType == "additionItem") {
          idsAry.push(addItems[i].itemId)
        } else {
          pushAdditionPackage.push(addItems[i].itemId)
        }

      }
      addMealIds = idsAry.toString()

    }

    var params = {
      //预约时间
      "reservationTime": this.data.selectDate.year + "-" + this.data.selectDate.month + "-" + this.data.selectDate.day,
      //用户数组
      "reservationPartyInfo": [contact],
      //医院id
      "reservedPartyId": this.data.options.hid,
      //医院名字
      "reservedPartyName": this.data.options.hospitalName,
      //医院地址
      "reservationPlace": this.data.options.hospitalAddress,
      //套餐id
      "serviceItemId": this.data.options.mid,
      //套餐名字
      "serviceItemName": this.data.options.mealName,
      "reservationType": 0,
      "itemIds": addMealIds,
      "itemBagIds":  pushAdditionPackage,
    }
    //console.log(params)
    //有代金券要传  couponId
    // params["couponId"]
    if (this.data.isSelectedVouncher) {
      params.couponId = this.data.selectedVouncher.id
    }
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    app.getServerce(
      app.data.url + '/reservation/checkup/new', 'POST',
      params,
      (isSuccess, data) => {
        if (isSuccess) {
          //console.log("下单成功")
          //设置订单id
          this.setData({
            orderId: data.data.id
          })
          app.payWithOrderId(data.data.id, "newOrder")
        } else {

          app.showloadingMessgage(data);

        }
      })

  },



/**
 * 关闭弹框modal
 */
  closeModal() {
    var windowHeight = 0
    wx.getSystemInfo({
      success: function(res) {
        windowHeight = res.windowHeight
      }
    })
    var animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    })
    animation.translate(0, windowHeight).step()
    if (this.data.showService) {
      this.setData({
        seviceAnimationData: animation.export(),
        selectDate: this.data.showDate,
        showService: false,
      })
    }
    if (this.data.showModal) {
      this.setData({
        animationData: animation.export(),
        selectDate: this.data.showDate,
        showModal: false,
        isShowCalendar: false,
      })
    }
    this.setData({
      isShowNext: 0, //为了重置 下一个月按钮
    })
  },

  //显示日历
  showMyCalender: function() {
    this.setDataSource()
    var windowWidth = 0

    wx.getSystemInfo({
      success: function(res) {
        windowWidth = res.windowWidth
      }
    })


    var animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    })
    animation.translate(0, -(932 * windowWidth / 750)).step()
    this.setData({
      animationData: animation.export(),
      showModal: true,
      isShowCalendar: true,
    })
  },


  // 选择代金券 that.data.hospital.id, that.data.meal.id
  selectDisCount: function() {},

  // 获取可以预约的时间
  getAllowBookTime: function() {

    let url = app.data.url + "/calendar?mealId=" + this.data.options.mid
    app.getServerce(url, "GET", {}, (isSuccess, data) => {

      if (isSuccess) {
        //console.log(data.data)
        let allTimes = data.data
        for (let i = 0; i < allTimes.length; i++) {
          let timesAry = allTimes[i].date.split("-")
          let year = timesAry[0]
          let month = timesAry[1]
          let day = timesAry[2]
          allTimes[i].year = year
          allTimes[i].month = month
          allTimes[i].day = day
        }
        this.setData({
          allowOrderTimes: allTimes
        })
      } else {
        app.showloadingMessgage("暂无可预约时间");

      }
    })

  },
  // 给日历赋值
  setDataSource: function() {
    // 页面初始化 
    let myDate = new Date();
    //获取当前年
    let year = myDate.getFullYear();
    //获取当前月
    let month = myDate.getMonth() + 1;
    //获取当前日
    let date = myDate.getDate();

    //如果日期没有值，要给显示的日期默认值
    let showYear = year;
    let showMonth = month;
    let showDay = date;

    if (this.data.allowOrderTimes.length > 0) {
      let time = this.data.allowOrderTimes[0]
     
      showYear = parseInt(time.year)
      showMonth = parseInt(time.month)
      showDay = parseInt(time.day)
    }

    //1号是周几
    var fistDayWeek = new Date(Date.UTC(showYear, showMonth - 1, 1)).getDay()

    this.setData({
      //保存当前年月日
      nowYear: year,
      nowMonth: month,
      nowDate: date,
      tagDate: {
        year: showYear,
        month: showMonth,
        day: showDay
      }, //第一次显示的日期
      year: showYear,
      month: showMonth,
      date: showDay,

    })

    //获取当前月天数
    let daysArr = this.getDataSource(showYear, showMonth, fistDayWeek);

    this.setData({
      dataSource: daysArr
    })
  },
  getDataSource(year, month, fistDayWeek) {
    //考虑第一行要显示上个月几天,和这个月1号周几的个数一样 fistDayWeek
    //考虑上一个月的天数
    {
      /* 1,3,5,7,8,10,12月 ：31天
              4，6，9，11月 ： 30天
              平年 2月 ： 28，
              闰年 2 月 ：29   
          */
    }
    let daysArr = []
    //上个月的天数
    let perDays = this.getMonthDays(year, month - 1)
    for (let i = perDays - fistDayWeek; i < perDays; i++) {

      daysArr.push({
        'day': i + 1,
        'month': month == '1' ? 12 : month - 1,
        'year': year,
        isCanSelect: this.isSelectData(year, month == '1' ? 12 : month - 1, i + 1)
      });
    }
    //这个月天数
    let nowDays = this.getMonthDays(year, month)
    for (let j = 1; j <= nowDays; j++) {

      daysArr.push({
        'day': j,
        'month': month,
        'year': year,
        isCanSelect: this.isSelectData(year, month, j)
      });
    }
    //要显示下个月的天数
    let nextAddDays = 35 - fistDayWeek - nowDays
    for (let k = 1; k <= nextAddDays; k++) {

      daysArr.push({
        'day': k,
        'month': month == '12' ? 1 : month + 1,
        'year': year,
        isCanSelect: this.isSelectData(year, month == '12' ? 1 : month + 1, k)
      });
    }
    return daysArr
  },
  //判断平年闰年
  getMonthDays(year, month) {
    if (month == '2') {
      if ((year % 4 == 0) && (year % 100 != 0 || year % 400 == 0)) {
        return 29;
      } else {
        return 28;
      }
    } else if (month == '4' || month == '6' || month == '9' || month == '11') {
      return 30;
    } else {
      return 31;
    }

  },

  //判断这个日子可不可选
  isSelectData(year, month, day) {
    let allTimes = this.data.allowOrderTimes

    //套餐
    for (let k = 0; k < allTimes.length; k++) {
      if (year == allTimes[k].year && month == allTimes[k].month && day == allTimes[k].day && allTimes[k].bookingNumber != 0) {
        return {
          isCanSelect: true,
          bookingNumber: allTimes[k].bookingNumber,
          isRestriction: allTimes[k].isRestriction
        }
      }
    }
    return {
      isCanSelect: false,
      bookingNumber: 0,
      isRestriction: false
    }

 
  },

  preMonth() {
    if (this.data.month == 1) {
      let myNextOneDay = new Date(this.data.year - 1, 11, 1);
      let nextDaysArr = this.getDataSource(this.data.year - 1, 12, myNextOneDay.getDay())
      this.setData({
        year: this.data.year - 1,
        month: 12,
        fistDayWeek: myNextOneDay,
        dataSource: nextDaysArr,
        isShowNext: this.data.isShowNext - 1
      })
    } else {
      let myNextOneDay = new Date(this.data.year, this.data.month - 2, 1);
      let nextDaysArr = this.getDataSource(this.data.year, this.data.month - 1, myNextOneDay.getDay())
      this.setData({

        month: this.data.month - 1,
        fistDayWeek: myNextOneDay,
        dataSource: nextDaysArr,
        isShowNext: this.data.isShowNext - 1
      })
    }

  },
  nextMonth() {

    let myNextOneDay = new Date(this.data.year, this.data.month, 1);

    let nextDaysArr = this.getDataSource(this.data.year, this.data.month + 1, myNextOneDay.getDay())

    this.setData({
      dataSource: nextDaysArr,
      isShowNext: this.data.isShowNext + 1
    })

    if (this.data.month == 12) {
      this.setData({
        year: this.data.year + 1,
        month: 1,
        fistDayWeek: myNextOneDay,
      })
    } else {
      this.setData({
        month: this.data.month + 1,
        fistDayWeek: myNextOneDay,
      })
    }

  },

  itemClick(event) {
    //选中的日期
    if (event.currentTarget.dataset.date.year === this.data.selectDate.year && event.currentTarget.dataset.date.month === this.data.selectDate.month && event.currentTarget.dataset.date.day === this.data.selectDate.day) {
      this.setData({
        selectDate: {
          year: 0,
          month: 0,
          day: 0
        }
      })
    } else {
      this.setData({
        selectDate: event.currentTarget.dataset.date
      })
    }

  },

  // 日历中的确定事件
  gotoPushOrder: function() {
    console.log("nihaoa")

    this.setData({
      showDate: this.data.selectDate,
    })
    this.closeModal()
    if (this.data.selectDate.year == this.data.nowYear && this.data.selectDate.month == this.data.nowMonth && this.data.selectDate.day == this.data.nowDate) {
      wx.showModal({
        title: '温馨提示',
        content: '您选择的体检日期为当天，请确保您能在体检中心的体检时间范围内，抵达体检中心，并在导检台办理体检手续，以免耽误您的时间。',
        showCancel: false
      })
    }
  },



  addContactViewDidClick: function() {
    wx.navigateTo({
      url: '../CommonPeopleList/CommonPeopleList?fitSex=' + this.data.options.fitSex + '&maritalStatus=' + this.data.options.maritalStatus,
    })
  },


/**
 * 选择联系人
 */
  changeContact: function() {
    wx.navigateTo({
      url: '../CommonPeopleList/CommonPeopleList?selectedIndex=' + this.data.selectedIndex + '&fitSex=' + this.data.options.fitSex + '&maritalStatus=' + this.data.options.maritalStatus,
    })
  },



/**
 * 选择代金券
 */
  chooseVouncher: function() {
    wx.navigateTo({
      url: '../CouponList/CouponList?selectedVouncherIndex=' + this.data.selectedVouncherIndex + "&hid=" + this.data.options.hid + "&mid=" + this.data.options.mid,
    })
  },
  callUs: function() {
    //console.log("打电话")
    wx.makePhoneCall({
      phoneNumber: '400-188-9871',
    })
  },

  lookMealItem: function() {

    wx.navigateTo({
      url: '../mealItems/mealItems?mealPrice=' + this.data.options.salePrice + "&addItemsPrice=" + this.data.options.addItemsPrice + "&type=makeOrder",
    })
  },
  noticeMakeSureClick: function() {
    this.setData({
      isShowMarriedNotice: false,
    })

  }
})