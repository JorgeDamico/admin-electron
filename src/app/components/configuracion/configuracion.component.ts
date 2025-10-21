import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

type NombrePlural = 'productos' | 'marcas' | 'razones';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit{

  productos: any[] = [];
  marcas: any[] = [];
  razones: any[] = [];
  pageProductos: number = 1;
  pageMarcas: number = 1;
  pageRazones: number = 1;
  formulario: FormGroup;
  item: NombrePlural = 'productos';

  constructor(
    private fb: FormBuilder, 
    private toastr: ToastrService
  ) {
    this.formulario = this.fb.group({
          nombre: ['', Validators.required]
        });
  }

  ngOnInit(): void {
    this.buscarMarcas();
    this.buscarProductos();
    this.buscarRazones();
  }

  getPrimerIdLibre(nombre: keyof this): number {
    const lista = this[nombre] as { id: number }[];
    const ids = lista.map(p => p.id).sort((a, b) => a - b);
    let nuevoId = 1;
    for (const id of ids) {
      if (id === nuevoId) {
        nuevoId++;
      } else {
        break;
      }
    }
    return nuevoId;
  }

  crearItem(nombre: NombrePlural) {
    const nuevoId = this.getPrimerIdLibre(nombre);

    const campoMap: Record<NombrePlural, string> = {
      productos: 'producto',
      marcas: 'marca',
      razones: 'razon'
    };

    const campo = campoMap[nombre];
    const nombreCampo = this.formulario.value.nombre;

    const nuevoItem = { id: nuevoId, [campo]: nombreCampo };

    this[nombre].push(nuevoItem);
    this.guardarProductos(nombre);
    this.formulario.reset();
  }

  guardarProductos(nombre: keyof this) {
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, `${String(nombre)}.json`);
    const contenido = JSON.stringify(this[nombre], null, 2);
    (window as any).electronAPI.writeFile(filePath, contenido);
    this.mostrarMensaje();
  }

  eliminarItem(nombre: NombrePlural, id: number) {
    this.elegirItem(nombre);
    const lista = this[this.item] as { id: number }[];
    this[this.item] = lista.filter(item => item.id !== id);
    this.guardarProductos(nombre);
  }

  elegirItem(nombre: NombrePlural) {
    this.item = nombre;
  }

  buscarRazones() {
    const folderPath = (window as any).electronAPI.createFolderIfMissing('MisGastos');
    const filePath = (window as any).electronAPI.joinPath(folderPath, 'razones.json');

    if ((window as any).electronAPI.existsFile(filePath)) {
      const contenido = (window as any).electronAPI.readFile(filePath);
      this.razones = JSON.parse(contenido).sort((a: any, b: any) =>
        a.razon.localeCompare(b.razon)
      );
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
      this.productos = JSON.parse(contenido).sort((a: any, b: any) =>
        a.producto.localeCompare(b.producto)
      );
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
      this.marcas = JSON.parse(contenido).sort((a: any, b: any) =>
        a.marca.localeCompare(b.marca)
      );
    } else {
      console.error('Archivo marcas.json no encontrado en MisGastos');
      this.marcas = [];
    }
  }

  mostrarMensaje() {
    this.toastr.info('Actualizado exitoso', 'OK');
  }

}
