document.addEventListener('DOMContentLoaded', function() {
  const weightInput = document.getElementById('cn');
  const heightInput = document.getElementById('cc');
  const bmiDiv = document.getElementById('bmi');
  const clt1Div = document.getElementById('clt1');
  const clt2Div = document.getElementById('clt2');
  var clt = 0


  function calculateBMI() {
    const weight = parseFloat(weightInput.value);
    const height = parseFloat(heightInput.value) / 100; // Convert cm to meters
    if(!isNaN(height) && height > 0){
      clt = height * height * 22;
      clt1Div.textContent = clt.toFixed(2);
      clt2Div.textContent = clt.toFixed(2);
    }
    if (!isNaN(weight) && !isNaN(height) && height > 0) {
      const bmi = weight / (height * height);
      bmiDiv.textContent = bmi.toFixed(2);
    } else {
      bmiDiv.textContent = '';
    }

    $('#e_nckn_total').text(((($('#e_nckn').val() && !isNaN($('#e_nckn').val())) ? parseInt($('#e_nckn').val()) : 0) * clt).toFixed(0));
    $('#can_thiep_total').text(((($('#can_thiep_kcal').val() && !isNaN($('#can_thiep_kcal').val())) ? parseInt($('#can_thiep_kcal').val()) : 0) * ($('#can_thiep_kg').val() && !isNaN($('#can_thiep_kg').val()) ? parseInt($('#can_thiep_kg').val()) : 0)).toFixed(0))
  }

  function calculateTTDD() {
    const ttdd = {
      cn_1_thang: $('#cn_1_thang').val() ? parseInt($('#cn_1_thang').val()) : 0,
      khau_phan_an: $('#khau_phan_an').val() ? parseInt($('#khau_phan_an').val()) : 0,
      trieu_chung_th: $('#trieu_chung_th').val() ? parseInt($('#trieu_chung_th').val()) : 0,
      giam_chuc_nang_hd: $('#giam_chuc_nang_hd').val() ? parseInt($('#giam_chuc_nang_hd').val()) : 0,
      nhu_cau_chuyen_hoa: $('#nhu_cau_chuyen_hoa').val() ? parseInt($('#nhu_cau_chuyen_hoa').val()) : 0,
      kham_lam_sang: $('#kham_lam_sang').val() ? parseInt($('#kham_lam_sang').val()) : 0,
      chon_tt_1: $('[name="chon_tt_1"]:radio:checked').val() ? parseInt($('[name="chon_tt_1"]:radio:checked').val()) : 0
    }
    let total = 0;
    for(let key in ttdd){
      total += ttdd[key];
    }
    switch(total){
      case 0:
      case 1:
      case 2:
      case 3:
        $('#chuan_doan_dinh_duong').text('Không nguy cơ');
        $('#chuan_doan_dinh_duong').addClass('text-success');
        break;
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        $('#chuan_doan_dinh_duong').text('SDD nhẹ/vừa');
        $('#chuan_doan_dinh_duong').addClass('text-warning');
        break;
      case 9:
      case 10:
      case 11:
      case 12:
        $('#chuan_doan_dinh_duong').text('SDD nặng');
        $('#chuan_doan_dinh_duong').addClass('text-danger');
        break;
      default:
        $('#chuan_doan_dinh_duong').text('');
        break;
    }
  }

  calculateBMI();
  weightInput.addEventListener('input', calculateBMI);
  heightInput.addEventListener('input', calculateBMI);
  document.getElementById("cn_1_thang").addEventListener("change", function (evt) {
    calculateTTDD();
  });
  document.getElementById("khau_phan_an").addEventListener("change", function (evt) {
    calculateTTDD();
  })
  document.getElementById("trieu_chung_th").addEventListener("change", function (evt) {
    calculateTTDD();
  })
  document.getElementById("giam_chuc_nang_hd").addEventListener("change", function (evt) {
    calculateTTDD();
  })
  document.getElementById("nhu_cau_chuyen_hoa").addEventListener("change", function (evt) {
    calculateTTDD();
  })
  document.getElementById("kham_lam_sang").addEventListener("change", function (evt) {
    calculateTTDD();
  })
  $('input[type=radio][name=chon_tt_1]').change(function() {
      calculateTTDD();
  });

  document.getElementById("e_nckn").addEventListener("input", function (evt) {
    $('#e_nckn_total').text(((($('#e_nckn').val() && !isNaN($('#e_nckn').val())) ? parseInt($('#e_nckn').val()) : 0) * clt).toFixed(0))
  })
  document.getElementById("can_thiep_kcal").addEventListener("input", function (evt) {
    $('#can_thiep_total').text(((($('#can_thiep_kcal').val() && !isNaN($('#can_thiep_kcal').val())) ? parseInt($('#can_thiep_kcal').val()) : 0) * ($('#can_thiep_kg').val() && !isNaN($('#can_thiep_kg').val()) ? parseInt($('#can_thiep_kg').val()) : 0)).toFixed(0))
  })
  document.getElementById("can_thiep_kg").addEventListener("input", function (evt) {
    $('#can_thiep_total').text(((($('#can_thiep_kcal').val() && !isNaN($('#can_thiep_kcal').val())) ? parseInt($('#can_thiep_kcal').val()) : 0) * ($('#can_thiep_kg').val() && !isNaN($('#can_thiep_kg').val()) ? parseInt($('#can_thiep_kg').val()) : 0)).toFixed(0))
  })
});
