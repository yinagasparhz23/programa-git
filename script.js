// ==========================================
// MEDPHARM — CONEXIÓN A BASE DE DATOS
// ==========================================

// Variable global
let productos = [];
let proveedores = [];

// ==========================================
// INICIO DE SESIÓN CON BD
// ==========================================
document.getElementById('btn-ingresar').addEventListener('click', async () => {
  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value.trim();
  const mensaje = document.getElementById('mensaje-error');

  const respuesta = await fetch('validar_usuario.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, clave })
  });

  const datos = await respuesta.json();
  
  if (datos.valido) {
    document.getElementById('pantalla-login').classList.remove('visible');
    document.getElementById('pantalla-login').classList.add('oculto');
    document.getElementById('sistema').classList.remove('oculto');
    await cargarTodo();
  } else {
    mensaje.classList.remove('oculto');
  }
});

document.getElementById('btn-salir').addEventListener('click', () => {
  document.getElementById('sistema').classList.add('oculto');
  document.getElementById('pantalla-login').classList.add('visible');
  document.getElementById('clave').value = '';
  document.getElementById('mensaje-error').classList.add('oculto');
});

// ==========================================
// NAVEGACIÓN ENTRE PANTALLAS
// ==========================================
document.querySelectorAll('.boton-menu').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.boton-menu').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    const id = boton.getAttribute('data-pantalla');
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('visible'));
    document.getElementById(id).classList.add('visible');
    actualizarTodo();
  });
});

// ==========================================
// CARGAR DATOS DESDE LA BASE
// ==========================================
async function cargarTodo() {
  const resProd = await fetch('php/obtener_productos.php');
  productos = await resProd.json();
  
  const resProv = await fetch('php/obtener_proveedores.php');
  proveedores = await resProv.json();
  
  actualizarTodo();
}

// ==========================================
// CALCULAR ESTADOS: VENCIMIENTO Y STOCK
// ==========================================
function calcularEstado(stock, fechaStr, stockMinimo = 20) {
  const hoy = new Date();
  const fecha = new Date(fechaStr);
  const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  
  let estadoStock = 'ok';
  if (stock === 0) estadoStock = 'sin-stock';
  else if (stock < stockMinimo) estadoStock = 'bajo';
  
  let estadoVenc = 'vigente';
  if (dias <= 0) estadoVenc = 'vencido';
  else if (dias <= 30) estadoVenc = 'proximo';
  
  return { dias, estadoStock, estadoVenc };
}

// ==========================================
// FORMULARIO: AGREGAR PRODUCTO
// ==========================================
document.getElementById('btn-mostrar-form-prod')?.addEventListener('click', () => {
  document.getElementById('form-prod-container').classList.toggle('oculto');
});
document.getElementById('btn-cancelar-prod')?.addEventListener('click', () => {
  document.getElementById('form-prod-container').classList.add('oculto');
  document.getElementById('form-producto').reset();
});

document.getElementById('form-producto')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = {
    nombre: document.getElementById('prod-nombre').value,
    categoria: document.getElementById('prod-cat').value,
    lote: document.getElementById('prod-lote').value,
    stock: parseInt(document.getElementById('prod-stock').value),
    fecha: document.getElementById('prod-fecha').value,
    proveedor: document.getElementById('prod-prov').value
  };

  await fetch('php/agregar_producto.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  await cargarTodo();
  document.getElementById('form-producto').reset();
  document.getElementById('form-prod-container').classList.add('oculto');
  alert('✅ Producto guardado correctamente');
});

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================
window.eliminarProducto = async function(id) {
  if (confirm('¿Seguro que quieres eliminar este producto?')) {
    await fetch(`php/eliminar_producto.php?id=${id}`);
    await cargarTodo();
  }
};

// ==========================================
// FORMULARIO: AGREGAR PROVEEDOR
// ==========================================
document.getElementById('btn-mostrar-form-prov')?.addEventListener('click', () => {
  document.getElementById('form-prov-container').classList.toggle('oculto');
});
document.getElementById('btn-cancelar-prov')?.addEventListener('click', () => {
  document.getElementById('form-prov-container').classList.add('oculto');
  document.getElementById('form-proveedor').reset();
});

document.getElementById('form-proveedor')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const datos = {
    nombre: document.getElementById('prov-nombre').value,
    contacto: document.getElementById('prov-persona').value,
    telefono: document.getElementById('prov-tel').value,
    email: document.getElementById('prov-email').value
  };

  await fetch('php/agregar_proveedor.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  await cargarTodo();
  document.getElementById('form-proveedor').reset();
  document.getElementById('form-prov-container').classList.add('oculto');
  alert('✅ Proveedor guardado correctamente');
});

// ==========================================
// ELIMINAR PROVEEDOR
// ==========================================
window.eliminarProveedor = async function(id) {
  if (confirm('¿Seguro que quieres eliminar este proveedor?')) {
    await fetch(`php/eliminar_proveedor.php?id=${id}`);
    await cargarTodo();
  }
};

// ==========================================
// ACTUALIZAR TODA LA PANTALLA
// ==========================================
function actualizarTodo() {
  // Fecha actual
  const hoy = new Date();
  const fechaTexto = hoy.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.querySelectorAll('.fecha').forEach(el => el.textContent = fechaTexto);

  // Calcular estados
  const vencidos = productos.filter(p => calcularEstado(p.stock, p.fecha_vencimiento || p.fecha).estadoVenc === 'vencido');
  const bajoStock = productos.filter(p => calcularEstado(p.stock, p.fecha_vencimiento || p.fecha, p.stock_minimo || 20).estadoStock === 'bajo');
  const sinStock = productos.filter(p => calcularEstado(p.stock, p.fecha_vencimiento || p.fecha).estadoStock === 'sin-stock');
  const proximos = productos.filter(p => calcularEstado(p.stock, p.fecha_vencimiento || p.fecha).estadoVenc === 'proximo');

  // Tarjetas resumen
  const elTotal = document.getElementById('total-prod');
  if (elTotal) elTotal.textContent = productos.length;
  
  const elVencidos = document.getElementById('cant-vencidos');
  if (elVencidos) elVencidos.textContent = vencidos.length;
  
  const elBajo = document.getElementById('cant-bajo');
  if (elBajo) elBajo.textContent = bajoStock.length;
  
  const elSin = document.getElementById('cant-sin');
  if (elSin) elSin.textContent = sinStock.length;
  
  const elContVenc = document.getElementById('cont-vencidos');
  if (elContVenc) elContVenc.textContent = `${vencidos.length} vencidos`;
  
  const elContBajo = document.getElementById('cont-bajo-stock');
  if (elContBajo) elContBajo.textContent = `${bajoStock.length + sinStock.length} bajo stock`;

  // Tabla Productos
  const tbodyProd = document.getElementById('lista-productos');
  if (tbodyProd) {
    tbodyProd.innerHTML = '';
    productos.forEach(p => {
      const est = calcularEstado(p.stock, p.fecha_vencimiento || p.fecha, p.stock_minimo || 20);
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.categoria || '-'}</td>
        <td>${p.lote || '-'}</td>
        <td>${p.stock}</td>
        <td class="${est.estadoStock}">${est.estadoStock === 'ok' ? 'OK' : est.estadoStock === 'bajo' ? 'Bajo' : 'Sin stock'}</td>
        <td>${new Date(p.fecha_vencimiento || p.fecha).toLocaleDateString('es-ES')}</td>
        <td>${p.proveedor || '-'}</td>
        <td><button class="btn-eliminar" onclick="eliminarProducto(${p.id})">🗑️</button></td>
      `;
      tbodyProd.appendChild(fila);
    });
  }

  // Tabla Proveedores
  const gridProv = document.getElementById('lista-proveedores');
  if (gridProv) {
    gridProv.innerHTML = '';
    proveedores.forEach(p => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-proveedor';
      tarjeta.innerHTML = `
        <div class="iniciales-proveedor">${(p.nombre || 'P').charAt(0)}</div>
        <div class="estado-proveedor">Activo</div>
        <h3>${p.nombre}</h3>
        <p>${p.contacto || '-'}</p>
        <p>📞 ${p.telefono || 'No registrado'}</p>
        <p>✉️ ${p.email || 'No registrado'}</p>
        <button class="btn-eliminar-prov" onclick="eliminarProveedor(${p.id})">🗑️ Eliminar</button>
      `;
      gridProv.appendChild(tarjeta);
    });
  }

  // Tabla Vencimientos
  const tbodyVenc = document.getElementById('lista-vencimientos');
  if (tbodyVenc) {
    tbodyVenc.innerHTML = '';
    productos.forEach(p => {
      const est = calcularEstado(p.stock, p.fecha_vencimiento || p.fecha);
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.lote || '-'}</td>
        <td>${p.categoria || '-'}</td>
        <td>${new Date(p.fecha_vencimiento || p.fecha).toLocaleDateString('es-ES')}</td>
        <td class="${est.estadoVenc === 'vencido' ? 'vencido' : ''}">${est.dias <= 0 ? 'Vencido' : est.dias + ' días'}</td>
        <td class="${est.estadoVenc === 'vencido' ? 'vencido' : ''}">${est.estadoVenc === 'vencido' ? '🔴 Vencido' : est.estadoVenc === 'proximo' ? '🟡 Próximo' : '🟢 Vigente'}</td>
        <td>${p.stock}</td>
        <td><button class="btn-eliminar" onclick="eliminarProducto(${p.id})">🗑️</button></td>
      `;
      tbodyVenc.appendChild(fila);
    });
  }

  // Tarjetas página Vencimientos
  const rvTotal = document.getElementById('rv-total');
  if (rvTotal) rvTotal.textContent = productos.length;
  
  const rvVencidos = document.getElementById('rv-vencidos');
  if (rvVencidos) rvVencidos.textContent = vencidos.length;
  
  const rvProx = document.getElementById('rv-proximos');
  if (rvProx) rvProx.textContent = proximos.length;
  
  const rvStock = document.getElementById('rv-stock');
  if (rvStock) rvStock.textContent = sinStock.length;
  
  const etVenc = document.getElementById('et-vencidos');
  if (etVenc) etVenc.textContent = `${vencidos.length} vencidos`;
}