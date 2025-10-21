import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  title = 'Gastos';
  datos: any[] = [];
  meses = [
    { number: '01', name: 'Enero' },
    { number: '02', name: 'Febrero' },
    { number: '03', name: 'Marzo' },
    { number: '04', name: 'Abril' },
    { number: '05', name: 'Mayo' },
    { number: '06', name: 'Junio' },
    { number: '07', name: 'Julio' },
    { number: '08', name: 'Agosto' },
    { number: '09', name: 'Septiembre' },
    { number: '10', name: 'Octubre' },
    { number: '11', name: 'Noviembre' },
    { number: '12', name: 'Diciembre' }
  ];
  mesSeleccionado = '';
  anioSeleccionado = '';
  formulario: FormGroup;
  page: number = 1;
  totalMes: number = 0;
  gastoSeleccionado: any;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private toastr: ToastrService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      mes: [''],
      anio: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosPorMes();
  }

  cargarDatosPorMes() {
    let month = this.formulario.value.mes;
    let year = this.formulario.value.anio;
    if (!month || !year) {
      const fechaActual = new Date();
      month = fechaActual.toLocaleString('default', { month: '2-digit' });
      year = fechaActual.getFullYear().toString();
      this.formulario.patchValue({ mes: month, anio: year });
    }

    const clave = `${month}`;

    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, `${year}.json`);

    let data: any = {};

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      data = JSON.parse(contenido);
      this.datos = data[clave] || [];
      this.totalMes = this.datos.reduce((acc: number, gasto: any) => acc + (gasto.total || 0), 0);
    } else {
      console.error('Archivo no encontrado:', filePath);
      this.datos = [];
      this.totalMes = 0;
    }
  }

  eliminarGasto() {
    let gasto: any = this.gastoSeleccionado;
    const month = this.formulario.value.mes;
    const year = this.formulario.value.anio;
    const clave = `${month}`;

    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, `${year}.json`);

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      const data = JSON.parse(contenido);

      const actualizados = (data[clave] || []).filter((g: any) => g.id !== gasto.id);
      data[clave] = actualizados;

      const nuevoContenido = JSON.stringify(data, null, 2);
      (window as any).electronAPI.writeFile(filePath, nuevoContenido);

      this.datos = actualizados;
      this.totalMes = actualizados.reduce((acc: number, g: any) => acc + (g.total || 0), 0);
    }
    this.mostrarMensaje();
  }

  seleccionarGasto(gasto: any) {
    this.gastoSeleccionado = gasto;
  }

  mostrarMensaje() {
    this.toastr.warning('Gasto Eliminado', 'OK');
  }

  editarCarga() {
    let gasto: any = this.gastoSeleccionado;
    this.router.navigate(['/carga', this.gastoSeleccionado.id], { state: { gasto } });
  }

}
