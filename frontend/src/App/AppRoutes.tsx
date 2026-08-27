import React, { lazy, Suspense } from 'react';
import { Redirect, Route } from 'react-router-dom';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import NotFound from 'Components/NotFound';
import Switch from 'Components/Router/Switch';
import MovieIndex from 'Movie/Index/MovieIndex';
import getPathWithUrlBase from 'Utilities/getPathWithUrlBase';

// Every route other than the movie index is loaded on demand, so the code the
// entry page needs is all the boot bundle carries.
const Blocklist = lazy(() => import('Activity/Blocklist/Blocklist'));
const History = lazy(() => import('Activity/History/History'));
const Queue = lazy(() => import('Activity/Queue/Queue'));
const AddNewMovieConnector = lazy(
  () => import('AddMovie/AddNewMovie/AddNewMovieConnector')
);
const ImportMovies = lazy(() => import('AddMovie/ImportMovie/ImportMovies'));
const CalendarPage = lazy(() => import('Calendar/CalendarPage'));
const CollectionConnector = lazy(
  () => import('Collection/CollectionConnector')
);
const DiscoverMovieConnector = lazy(
  () => import('DiscoverMovie/DiscoverMovieConnector')
);
const MovieDetailsPage = lazy(() => import('Movie/Details/MovieDetailsPage'));
const CustomFormatSettingsPage = lazy(
  () => import('Settings/CustomFormats/CustomFormatSettingsPage')
);
const DownloadClientSettingsConnector = lazy(
  () => import('Settings/DownloadClients/DownloadClientSettingsConnector')
);
const GeneralSettingsConnector = lazy(
  () => import('Settings/General/GeneralSettingsConnector')
);
const ImportListSettings = lazy(
  () => import('Settings/ImportLists/ImportListSettings')
);
const IndexerSettings = lazy(() => import('Settings/Indexers/IndexerSettings'));
const MediaManagement = lazy(
  () => import('Settings/MediaManagement/MediaManagement')
);
const MetadataSettings = lazy(
  () => import('Settings/Metadata/MetadataSettings')
);
const NotificationSettings = lazy(
  () => import('Settings/Notifications/NotificationSettings')
);
const Profiles = lazy(() => import('Settings/Profiles/Profiles'));
const QualityConnector = lazy(
  () => import('Settings/Quality/QualityConnector')
);
const Settings = lazy(() => import('Settings/Settings'));
const TagSettings = lazy(() => import('Settings/Tags/TagSettings'));
const UISettingsConnector = lazy(
  () => import('Settings/UI/UISettingsConnector')
);
const BackupsConnector = lazy(() => import('System/Backup/BackupsConnector'));
const LogsTableConnector = lazy(
  () => import('System/Events/LogsTableConnector')
);
const Logs = lazy(() => import('System/Logs/Logs'));
const Status = lazy(() => import('System/Status/Status'));
const Tasks = lazy(() => import('System/Tasks/Tasks'));
const Updates = lazy(() => import('System/Updates/Updates'));
const CutoffUnmet = lazy(() => import('Wanted/CutoffUnmet/CutoffUnmet'));
const Missing = lazy(() => import('Wanted/Missing/Missing'));

function RedirectWithUrlBase() {
  return <Redirect to={getPathWithUrlBase('/')} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Switch>
        {/*
          Movies
        */}

        <Route exact={true} path="/" component={MovieIndex} />

        {window.Radarr.urlBase && (
          <Route
            exact={true}
            path="/"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            addUrlBase={false}
            render={RedirectWithUrlBase}
          />
        )}

        <Route path="/add/new" component={AddNewMovieConnector} />

        <Route path="/collections" component={CollectionConnector} />

        <Route path="/add/import" component={ImportMovies} />

        <Route path="/add/discover" component={DiscoverMovieConnector} />

        <Route path="/movie/:titleSlug" component={MovieDetailsPage} />

        {/*
          Calendar
        */}

        <Route path="/calendar" component={CalendarPage} />

        {/*
          Activity
        */}

        <Route path="/activity/history" component={History} />

        <Route path="/activity/queue" component={Queue} />

        <Route path="/activity/blocklist" component={Blocklist} />

        {/*
          Wanted
        */}

        <Route path="/wanted/missing" component={Missing} />

        <Route path="/wanted/cutoffunmet" component={CutoffUnmet} />

        {/*
          Settings
        */}

        <Route exact={true} path="/settings" component={Settings} />

        <Route path="/settings/mediamanagement" component={MediaManagement} />

        <Route path="/settings/profiles" component={Profiles} />

        <Route path="/settings/quality" component={QualityConnector} />

        <Route
          path="/settings/customformats"
          component={CustomFormatSettingsPage}
        />

        <Route path="/settings/indexers" component={IndexerSettings} />

        <Route
          path="/settings/downloadclients"
          component={DownloadClientSettingsConnector}
        />

        <Route path="/settings/importlists" component={ImportListSettings} />

        <Route path="/settings/connect" component={NotificationSettings} />

        <Route path="/settings/metadata" component={MetadataSettings} />

        <Route path="/settings/tags" component={TagSettings} />

        <Route path="/settings/general" component={GeneralSettingsConnector} />

        <Route path="/settings/ui" component={UISettingsConnector} />

        {/*
          System
        */}

        <Route path="/system/status" component={Status} />

        <Route path="/system/tasks" component={Tasks} />

        <Route path="/system/backup" component={BackupsConnector} />

        <Route path="/system/updates" component={Updates} />

        <Route path="/system/events" component={LogsTableConnector} />

        <Route path="/system/logs/files" component={Logs} />

        {/*
          Not Found
        */}

        <Route path="*" component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default AppRoutes;
