import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient} from '@angular/common/http';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  authSubscription?: Subscription;
  public resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/userCount');
  userCount : any;
  constructor(private accountService: AccountService, private router: Router, private http: HttpClient,private applicationConfigService: ApplicationConfigService) {}

  ngOnInit(): void {
    this.authSubscription = this.accountService.getAuthenticationState().subscribe(account => (this.account = account));
    this.http.get<BigInteger>(this.resourceUrl).subscribe(userCount => {
      this.userCount = userCount;
    });
    
  }

  isAuthenticated(): boolean {
    return this.accountService.isAuthenticated();
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
