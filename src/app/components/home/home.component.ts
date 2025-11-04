import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ChartData, ChartOptions, ChartDataset } from 'chart.js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit{

  title = 'Gastos: ';
  datos: any[] = [];
  datosAnuales: any[] = [];
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
  formulario: FormGroup;
  page: number = 1;
  totalMes: number = 0;
  gastoSeleccionado: any;
  gastosPorRazon: ChartData<'bar'> | undefined;
  gastosPorProducto: ChartData<'bar'> | undefined;
  gastosAnuales: ChartData<'line'> | undefined;
  typeList: any[] = [{value: 'razon', name: 'Razón'}, {value:'producto', name: 'Producto'}, {value:'anual', name: 'Anual'}];
  tipoSeleccionado: string = 'n';

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private toastr: ToastrService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      mes: [''],
      anio: [''],
      type: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatosPorMes('n');
  }

  cargarDatosPorMes(type: string) {
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
    let filePath: any;
    filePath = type === 'e' ? (window as any).electronAPI.joinPath(folderPath, `${year}-e.json`) :
      (window as any).electronAPI.joinPath(folderPath, `${year}.json`);

    let data: any = {};

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      data = JSON.parse(contenido);
      this.datosAnuales = data;
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

  procesarEstadisticas(type: string) {
    const razonMap = new Map<string, number>();
    const productoMap = new Map<string, number>();

    const mesSeleccionado = this.formulario.value.mes;
    
    if (!Array.isArray(this.datos) || this.datos.length === 0) {
      console.warn('No hay datos cargados para graficar');
      this.gastosPorRazon = undefined;
      this.gastosPorProducto = undefined;
      this.gastosAnuales = undefined;
      return;
    }

    const gastosDelMes = this.datos.filter((gasto: any) => {
      const partesFecha = gasto.fecha?.split('-');
      return partesFecha?.[1] === mesSeleccionado;
    });

    if (gastosDelMes.length === 0) {
      console.warn(`No hay gastos para el mes ${mesSeleccionado}`);
      return;
    }

    gastosDelMes.forEach((gasto: any) => {
      razonMap.set(gasto.razon, (razonMap.get(gasto.razon) || 0) + gasto.total);

      gasto.productos?.forEach((prod: any) => {
        productoMap.set(prod.nombre, (productoMap.get(prod.nombre) || 0) + prod.valorUnitario * prod.cantidad);
      });
    });

    if(type === 'razon') {
      this.gastosPorRazon = {
        labels: Array.from(razonMap.keys()),
        datasets: [
          {
            label: 'Gasto por razón',
            data: Array.from(razonMap.values()),
            backgroundColor: '#007bff'
          }
        ]
      };
    }

    if(type === 'producto') {
      this.gastosPorProducto = {
        labels: Array.from(productoMap.keys()),
        datasets: [
          {
            label: 'Gasto por producto',
            data: Array.from(productoMap.values()),
            backgroundColor: '#28a745'
          }
        ]
      };
    }

    if (type === 'anual') {
      const gastosPorMes = new Map<string, number>();
      console.log("data: ", this.datosAnuales);

      Object.entries(this.datosAnuales || {}).forEach(([mes, gastos]: [string, any[]]) => {
        gastos.forEach((gasto: any) => {
          gastosPorMes.set(mes, (gastosPorMes.get(mes) || 0) + gasto.total);
        });
      });

      const mesesOrdenados = Array.from({ length: 12 }, (_, i) =>
        (i + 1).toString().padStart(2, '0')
      );

      const labels = mesesOrdenados.map(m => {
        const encontrado = this.meses.find(mes => mes.number === m);
        return encontrado ? encontrado.name : m;
      });

      const data = mesesOrdenados.map(m => gastosPorMes.get(m) || 0);

      this.gastosAnuales = {
        labels,
        datasets: [
          {
            label: 'Gasto anual por mes',
            data,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220,53,69,0.2)',
            fill: true,
            tension: 0.3,
            type: 'line'
          } as ChartDataset<'line'>
        ]
      };
    }
    
  }

  getNombreMes(): string {
    const mes = this.formulario.value.mes;
    const encontrado = this.meses.find(m => m.number === mes);
    return encontrado ? encontrado.name : '';
  }

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `$ ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Mes'
        },
        ticks: {
          autoSkip: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Gasto total'
        },
        beginAtZero: true
      }
    }
  };

}
