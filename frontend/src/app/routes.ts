import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { SpindleComponent } from './spindle/spindle.component';
import { AethelComponent } from './aethel/aethel.component';
import { SpindleAboutComponent } from './spindle/spindle-about/spindle-about.component';
import { SpindleNotationComponent } from './spindle/spindle-notation/spindle-notation.component';
import { ReferencesComponent } from './references/references.component';
import { SampleComponent } from './sample/sample.component';
import { MinimalistParserComponent } from './minimalist-parser/minimalist-parser.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'spindle',
        children: [
            {
                path: 'about',
                component: SpindleAboutComponent
            },
            {
                path: 'notation',
                component: SpindleNotationComponent
            },
            {
                path: '',
                component: SpindleComponent
            }
        ]
    },
    {
        path: 'aethel',
        children: [
            {
                path: 'sample/:sampleName',
                component: SampleComponent
            },
            {
                path: '',
                component: AethelComponent
            }
        ]
    },
    {
        path: 'minimalist-parser',
        component: MinimalistParserComponent
    },
    {
        path: 'about',
        component: HomeComponent,
    },
    {
        path: 'refs',
        component: ReferencesComponent,
    },
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/home'
    }
];

export { routes };
