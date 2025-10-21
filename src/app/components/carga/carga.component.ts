import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-carga',
  templateUrl: './carga.component.html',
  styleUrls: ['./carga.component.css']
})
export class CargaComponent implements OnInit{

  title = 'Carga';
  formulario: FormGroup;
  formularioModal: FormGroup;
  razones: any[] = [];
  page: number = 0;
  productos: any[] = [];
  productosSeleccionados: any[] = [];
  marcas: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private toastr: ToastrService
  ) 
  {
    this.formulario = this.fb.group({
      razon: ['', Validators.required],
      fecha: ['', Validators.required]
    });
    this.formularioModal = this.fb.group({
      producto: ['', Validators.required],
      marca: ['', Validators.required],
      cantidad: ['', Validators.required],
      valorUnitario: ['', Validators.required]
    });
  }

  ngOnInit() {console.log('electronAPI:', (window as any).electronAPI);
    this.buscarRazones();
    this.buscarProductos();
    this.buscarMarcas();

    const gastoEditado = history.state.gasto;
    if (gastoEditado) {
      this.formulario.patchValue({
        razon: gastoEditado.razon,
        fecha: this.formatearFecha(gastoEditado.fecha)
      });
      this.productosSeleccionados = gastoEditado.productos;
    }
  }

  formatearFecha(fecha: string): string {
    const [d, m, y] = fecha.split('-');
    return `${y}-${m}-${d}`;
  }

  buscarRazones() {
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, 'razones.json');

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      this.razones = JSON.parse(contenido);
    } else {
      console.error('Archivo razones.json no encontrado en MisGastos');
      this.razones = [];
    }
  }

  buscarProductos() {
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, 'productos.json');

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      this.productos = JSON.parse(contenido);
    } else {
      console.error('Archivo productos.json no encontrado en MisGastos');
      this.productos = [];
    }
  }

  buscarMarcas() {
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, 'marcas.json');

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      this.marcas = JSON.parse(contenido);
    } else {
      console.error('Archivo marcas.json no encontrado en MisGastos');
      this.marcas = [];
    }
  }

  agregarProducto() {
    let nuevoProducto = {
      nombre: this.formularioModal.value.producto,
      marca: this.formularioModal.value.marca,
      cantidad: this.formularioModal.value.cantidad,
      valorUnitario: this.formularioModal.value.valorUnitario
    }
    this.productosSeleccionados.push(nuevoProducto);
    this.formularioModal.reset();
  }

  cargarGasto() {
    const idEditando = history.state.gasto?.id;
    const [year, month, day] = this.formulario.value.fecha.split('-');
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, `${year}.json`);

    let data: any = {};

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      data = JSON.parse(contenido);
    }

    if (!data[month]) {
      data[month] = [];
    }

    let maxId = 0;
    (Object.values(data) as any[][]).forEach((gastos) => {
      gastos.forEach(g => {
        if (g.id > maxId) {
          maxId = g.id;
        }
      });
    });

    const nuevoId = maxId + 1;

    const gasto = {
      id: idEditando || nuevoId,
      razon: this.formulario.value.razon,
      fecha: `${day}-${month}-${year}`,
      total: this.productosSeleccionados.reduce((acc, prod) => acc + (prod.cantidad * prod.valorUnitario),0),
      productos: this.productosSeleccionados
    };

    if (idEditando) {
      const index = data[month].findIndex((g: { id: any; }) => g.id === idEditando);
      if (index !== -1) data[month][index] = gasto;
    } else {
      data[month].push(gasto);
    }

    (window as any).electronAPI.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Gasto guardado con ID ${nuevoId}`);
    this.cancelarGasto();
    this.limpiarModal();
    this.mostrarMensaje();
  }

  mostrarMensaje() {
    this.toastr.success('Gasto Guardado', 'OK');
  }

  limpiarModal() {
    this.formularioModal.reset();
  }

  cancelarGasto() {
    this.formulario.reset();
    this.productosSeleccionados = [];
  }

  eliminarSeleccion(item: any) {
    const index = this.productosSeleccionados.findIndex(p => p.id === item.id);
    if (index !== -1) {
      this.productosSeleccionados.splice(index, 1);
    }
  }

}
